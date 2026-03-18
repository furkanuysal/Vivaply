using Vivaply.API.Data;
using Microsoft.EntityFrameworkCore;
using Vivaply.API.Services.Entertainment.Tmdb;

namespace Vivaply.API.Services.Infrastructure.Jobs
{
    public class MetadataRefreshJob
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public MetadataRefreshJob(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        public async Task RefreshContentsAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var tmdb = scope.ServiceProvider.GetRequiredService<ITmdbService>();

            var now = DateTime.UtcNow;

            var staleMovies = await db.MovieMetadata
                .Where(x => x.LastFetchedAt < now.AddDays(-7))
                .OrderBy(x => x.LastFetchedAt)
                .Take(20)
                .ToListAsync();

            foreach (var movie in staleMovies)
            {
                try
                {
                    var details = await tmdb.GetMovieDetailsAsync(movie.TmdbMovieId);
                    if (details == null) continue;

                    movie.Title = details.Title ?? movie.Title;
                    movie.PosterPath = details.PosterPath;
                    movie.VoteAverage = details.VoteAverage;
                    movie.ProductionStatus = details.Status;
                    movie.LastFetchedAt = now;

                    await Task.Delay(200); // Fetching details for multiple movies in a short time may trigger TMDb's rate limits, so we add a small delay between requests.
                }
                catch
                {
                    // ignore → next cycle retry
                }
            }

            await db.SaveChangesAsync();
        }
    }
}
