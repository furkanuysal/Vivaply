using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Statistics;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Knowledge.Enums;
using Vivaply.API.Modules.Core.Ratings.Enums;
using Vivaply.API.Modules.Core.Statistics.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Statistics.Services.Implementations
{
    public class ContentEngagementStatsService(VivaplyDbContext dbContext) : IContentEngagementStatsService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;

        public Task<ContentEngagementStats?> GetStatsAsync(ContentSourceType sourceType, string sourceId)
        {
            return _dbContext.ContentEngagementStats
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.SourceType == sourceType && x.SourceId == sourceId);
        }

        public async Task RebuildAsync(ContentSourceType sourceType, string sourceId)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(sourceId);

            var snapshot = sourceType switch
            {
                ContentSourceType.Movie => await BuildMovieStatsAsync(sourceId),
                ContentSourceType.TvShow => await BuildShowStatsAsync(sourceId),
                ContentSourceType.Game => await BuildGameStatsAsync(sourceId),
                ContentSourceType.Book => await BuildBookStatsAsync(sourceId),
                _ => throw new ArgumentOutOfRangeException(nameof(sourceType), sourceType, "Unsupported content source type.")
            };

            var existing = await _dbContext.ContentEngagementStats
                .FirstOrDefaultAsync(x => x.SourceType == sourceType && x.SourceId == sourceId);

            if (snapshot.ListCount == 0)
            {
                if (existing != null)
                {
                    _dbContext.ContentEngagementStats.Remove(existing);
                    await _dbContext.SaveChangesAsync();
                }

                return;
            }

            if (existing == null)
            {
                snapshot.SourceType = sourceType;
                snapshot.SourceId = sourceId;
                _dbContext.ContentEngagementStats.Add(snapshot);
            }
            else
            {
                existing.ListCount = snapshot.ListCount;
                existing.ActiveCount = snapshot.ActiveCount;
                existing.CompletedCount = snapshot.CompletedCount;
                existing.PlannedCount = snapshot.PlannedCount;
                existing.DroppedCount = snapshot.DroppedCount;
                existing.OnHoldCount = snapshot.OnHoldCount;
                existing.CompletionRate = snapshot.CompletionRate;
                existing.LastAggregatedAt = snapshot.LastAggregatedAt;
            }

            await _dbContext.SaveChangesAsync();
        }

        private async Task<ContentEngagementStats> BuildMovieStatsAsync(string sourceId)
        {
            var tmdbId = int.Parse(sourceId);
            var rows = await _dbContext.UserMovies
                .AsNoTracking()
                .Where(x => x.TmdbMovieId == tmdbId)
                .GroupBy(x => x.Status)
                .Select(x => new { Status = x.Key, Count = x.Count() })
                .ToListAsync();

            return BuildStats(
                rows.Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Watching).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Completed).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.PlanToWatch).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Dropped).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.OnHold).Sum(x => x.Count));
        }

        private async Task<ContentEngagementStats> BuildShowStatsAsync(string sourceId)
        {
            var tmdbId = int.Parse(sourceId);
            var rows = await _dbContext.UserShows
                .AsNoTracking()
                .Where(x => x.TmdbShowId == tmdbId)
                .GroupBy(x => x.Status)
                .Select(x => new { Status = x.Key, Count = x.Count() })
                .ToListAsync();

            return BuildStats(
                rows.Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Watching).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Completed).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.PlanToWatch).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.Dropped).Sum(x => x.Count),
                rows.Where(x => x.Status == WatchStatus.OnHold).Sum(x => x.Count));
        }

        private async Task<ContentEngagementStats> BuildGameStatsAsync(string sourceId)
        {
            var igdbId = int.Parse(sourceId);
            var rows = await _dbContext.UserGames
                .AsNoTracking()
                .Where(x => x.IgdbId == igdbId)
                .GroupBy(x => x.Status)
                .Select(x => new { Status = x.Key, Count = x.Count() })
                .ToListAsync();

            return BuildStats(
                rows.Sum(x => x.Count),
                rows.Where(x => x.Status == PlayStatus.Playing).Sum(x => x.Count),
                rows.Where(x => x.Status == PlayStatus.Completed).Sum(x => x.Count),
                rows.Where(x => x.Status == PlayStatus.PlanToPlay).Sum(x => x.Count),
                rows.Where(x => x.Status == PlayStatus.Dropped).Sum(x => x.Count),
                rows.Where(x => x.Status == PlayStatus.OnHold).Sum(x => x.Count));
        }

        private async Task<ContentEngagementStats> BuildBookStatsAsync(string sourceId)
        {
            var rows = await _dbContext.UserBooks
                .AsNoTracking()
                .Where(x => x.GoogleBookId == sourceId)
                .GroupBy(x => x.Status)
                .Select(x => new { Status = x.Key, Count = x.Count() })
                .ToListAsync();

            return BuildStats(
                rows.Sum(x => x.Count),
                rows.Where(x => x.Status == ReadStatus.Reading).Sum(x => x.Count),
                rows.Where(x => x.Status == ReadStatus.Completed).Sum(x => x.Count),
                rows.Where(x => x.Status == ReadStatus.PlanToRead).Sum(x => x.Count),
                rows.Where(x => x.Status == ReadStatus.Dropped).Sum(x => x.Count),
                rows.Where(x => x.Status == ReadStatus.OnHold).Sum(x => x.Count));
        }

        private static ContentEngagementStats BuildStats(
            int listCount,
            int activeCount,
            int completedCount,
            int plannedCount,
            int droppedCount,
            int onHoldCount)
        {
            return new ContentEngagementStats
            {
                ListCount = listCount,
                ActiveCount = activeCount,
                CompletedCount = completedCount,
                PlannedCount = plannedCount,
                DroppedCount = droppedCount,
                OnHoldCount = onHoldCount,
                CompletionRate = listCount == 0 ? 0 : (double)completedCount / listCount,
                LastAggregatedAt = DateTime.UtcNow
            };
        }
    }
}
