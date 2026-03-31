using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Vivaply.API.Data;
using Vivaply.API.Infrastructure.Options;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;
using Vivaply.API.Modules.Core.Knowledge.Services.Interfaces;

namespace Vivaply.API.Infrastructure.Jobs
{
    public class MetadataRefreshJob(
        IServiceScopeFactory scopeFactory,
        IOptions<MetadataRefreshOptions> options,
        ILogger<MetadataRefreshJob> logger)
    {
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
        private readonly MetadataRefreshOptions _options = options.Value;
        private readonly ILogger<MetadataRefreshJob> _logger = logger;

        // Movies
        public async Task RefreshMoviesAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var tmdb = scope.ServiceProvider.GetRequiredService<ITmdbService>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-_options.MovieTtlDays);

            var query = db.MovieMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(_options.BatchSize);

            await ExecuteBatchAsync(
                db,
                query,
                x => x.TmdbMovieId,
                id => tmdb.GetMovieDetailsAsync(id),
                (movie, details) =>
                {
                    movie.Title = details.Title ?? movie.Title;
                    movie.PosterPath = details.PosterPath;
                    movie.VoteAverage = details.VoteAverage;
                    movie.ProductionStatus = details.Status;
                    movie.LastFetchedAt = now;
                },
                "Movies"
            );
        }

        // TV Shows
        public async Task RefreshShowsAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var tmdb = scope.ServiceProvider.GetRequiredService<ITmdbService>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-_options.ShowTtlDays);

            var query = db.ShowMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(_options.BatchSize);

            await ExecuteBatchAsync(
                db,
                query,
                x => x.TmdbShowId,
                id => tmdb.GetTvShowDetailsAsync(id),
                (show, details) =>
                {
                    show.Name = details.Name ?? show.Name;
                    show.PosterPath = details.PosterPath;
                    show.VoteAverage = details.VoteAverage;
                    show.ProductionStatus = details.Status;

                    show.LastKnownSeason = details.LastEpisodeToAir?.SeasonNumber;
                    show.LastKnownEpisode = details.LastEpisodeToAir?.EpisodeNumber;
                    show.NextEpisodeAirDate = ParseTmdbDate(details.NextEpisodeToAir?.AirDate);

                    show.LastFetchedAt = now;
                },
                "Shows"
            );
        }

        // Games
        public async Task RefreshGamesAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var igdb = scope.ServiceProvider.GetRequiredService<IIgdbService>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-_options.GameTtlDays);

            var query = db.GameMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(_options.BatchSize);

            await ExecuteBatchAsync(
                db,
                query,
                x => x.IgdbId,
                id => igdb.GetGameDetailAsync(id),
                (game, details) =>
                {
                    game.Title = details.Title;
                    game.CoverUrl = details.CoverUrl;
                    game.ReleaseDate = details.ReleaseDate;
                    game.LastFetchedAt = now;
                },
                "Games"
            );
        }

        // Books
        public async Task RefreshBooksAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var google = scope.ServiceProvider.GetRequiredService<IGoogleBooksService>();

            var now = DateTime.UtcNow;
            var threshold = now.AddDays(-_options.BookTtlDays);

            var query = db.BookMetadata
                .Where(x => x.LastFetchedAt < threshold)
                .OrderBy(x => x.LastFetchedAt)
                .Take(_options.BatchSize);

            await ExecuteBatchAsync(
                db,
                query,
                x => x.GoogleBookId,
                id => google.GetBookDetailsAsync(id),
                (book, details) =>
                {
                    book.Title = details.Title ?? book.Title;
                    book.CoverUrl = details.CoverUrl;
                    book.PageCount = details.PageCount;
                    book.LastFetchedAt = now;
                },
                "Books"
            );
        }

        // HELPERS

        private async Task ExecuteBatchAsync<TEntity, TId, TDetails>(
            VivaplyDbContext db,
            IQueryable<TEntity> query,
            Func<TEntity, TId> idSelector,
            Func<TId, Task<TDetails?>> fetchFunc,
            Action<TEntity, TDetails> updateAction,
            string logPrefix)
        {

            var items = await query.ToListAsync();

            if (!items.Any())
            {
                _logger.LogInformation("[MetadataRefresh] No stale {Type} found.", logPrefix);
                return;
            }

            _logger.LogInformation("[MetadataRefresh] Refreshing {Count} {Type}...", items.Count, logPrefix);

            var semaphore = new SemaphoreSlim(_options.MaxConcurrency);

            var tasks = items.Select(async item =>
            {
                await semaphore.WaitAsync();

                try
                {
                    var id = idSelector(item);
                    var details = await fetchFunc(id);

                    if (details == null) return;

                    updateAction(item, details);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "[MetadataRefresh] {Type} failed", logPrefix);
                }
                finally
                {
                    semaphore.Release();
                }
            });

            await Task.WhenAll(tasks);

            await db.SaveChangesAsync();

            _logger.LogInformation("[MetadataRefresh] {Type} refresh completed.", logPrefix);
        }

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