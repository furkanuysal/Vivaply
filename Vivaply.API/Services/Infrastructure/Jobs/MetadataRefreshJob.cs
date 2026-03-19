using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Services.Entertainment.Tmdb;
using Microsoft.Extensions.Logging;

namespace Vivaply.API.Services.Infrastructure.Jobs
{
    public class MetadataRefreshJob
    {
        private readonly IServiceScopeFactory _scopeFactory;

        // ---- CONFIG ----
        private const int MovieTtlDays = 14;
        private const int ShowTtlDays = 7;

        private const int BatchSize = 50;
        private const int MaxConcurrency = 5;

        public MetadataRefreshJob(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        // MOVIES
        public async Task RefreshMoviesAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var tmdb = scope.ServiceProvider.GetRequiredService<ITmdbService>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<MetadataRefreshJob>>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-MovieTtlDays);

            var movies = await db.MovieMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(BatchSize)
                .ToListAsync();

            if (!movies.Any())
            {
                logger.LogInformation("[MetadataRefresh] No stale movies found.");
                return;
            }

            logger.LogInformation("[MetadataRefresh] Refreshing {Count} movies...", movies.Count);

            var semaphore = new SemaphoreSlim(MaxConcurrency);

            var tasks = movies.Select(async movie =>
            {
                await semaphore.WaitAsync();

                try
                {
                    var details = await tmdb.GetMovieDetailsAsync(movie.TmdbMovieId);
                    if (details == null) return;

                    movie.Title = details.Title ?? movie.Title;
                    movie.PosterPath = details.PosterPath;
                    movie.VoteAverage = details.VoteAverage;
                    movie.ProductionStatus = details.Status;
                    movie.LastFetchedAt = now;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "[MetadataRefresh] Movie failed: {Id}", movie.TmdbMovieId);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);

            await db.SaveChangesAsync();

            logger.LogInformation("[MetadataRefresh] Movies refresh completed.");
        }

        // TV SHOWS
        public async Task RefreshShowsAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var tmdb = scope.ServiceProvider.GetRequiredService<ITmdbService>();
            var logger = scope.ServiceProvider.GetRequiredService<ILogger<MetadataRefreshJob>>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-ShowTtlDays);

            var shows = await db.ShowMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(BatchSize)
                .ToListAsync();

            if (!shows.Any())
            {
                logger.LogInformation("[MetadataRefresh] No stale shows found.");
                return;
            }

            logger.LogInformation("[MetadataRefresh] Refreshing {Count} shows...", shows.Count);

            var semaphore = new SemaphoreSlim(MaxConcurrency);

            var tasks = shows.Select(async show =>
            {
                await semaphore.WaitAsync();

                try
                {
                    var details = await tmdb.GetTvShowDetailsAsync(show.TmdbShowId);
                    if (details == null) return;

                    show.Name = details.Name ?? show.Name;
                    show.PosterPath = details.PosterPath;
                    show.VoteAverage = details.VoteAverage;
                    show.ProductionStatus = details.Status;

                    show.LastKnownSeason = details.LastEpisodeToAir?.SeasonNumber;
                    show.LastKnownEpisode = details.LastEpisodeToAir?.EpisodeNumber;
                    show.NextEpisodeAirDate = ParseTmdbDate(details.NextEpisodeToAir?.AirDate);

                    show.LastFetchedAt = now;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "[MetadataRefresh] Show failed: {Id}", show.TmdbShowId);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);

            await db.SaveChangesAsync();

            logger.LogInformation("[MetadataRefresh] Shows refresh completed.");
        }

        // =========================
        // 🧩 HELPER
        // =========================
        private static DateTime? ParseTmdbDate(string? date)
        {
            if (string.IsNullOrWhiteSpace(date))
                return null;

            if (!DateTime.TryParse(
                date,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal,
                out var parsed))
                return null;

            return parsed.ToUniversalTime();
        }
    }
}