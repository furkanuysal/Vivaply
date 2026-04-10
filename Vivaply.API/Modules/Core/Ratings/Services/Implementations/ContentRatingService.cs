using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Ratings;
using Vivaply.API.Modules.Core.Ratings.Enums;
using Vivaply.API.Modules.Core.Ratings.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Ratings.Services.Implementations
{
    public class ContentRatingService(VivaplyDbContext dbContext) : IContentRatingService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;

        public async Task SetRatingAsync(
            Guid userId,
            ContentSourceType sourceType,
            string sourceId,
            double? rating,
            CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(sourceId))
                throw new ArgumentException("SourceId is required.", nameof(sourceId));

            if (rating.HasValue && (rating.Value < 0 || rating.Value > 10))
                throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 0 and 10.");

            var normalizedSourceId = sourceId.Trim();

            var existingRating = await _dbContext.ContentRatings
                .FirstOrDefaultAsync(
                    x => x.UserId == userId &&
                         x.SourceType == sourceType &&
                         x.SourceId == normalizedSourceId,
                    cancellationToken);

            if (!rating.HasValue || rating.Value <= 0)
            {
                if (existingRating != null)
                    _dbContext.ContentRatings.Remove(existingRating);
            }
            else if (existingRating == null)
            {
                _dbContext.ContentRatings.Add(new ContentRating
                {
                    UserId = userId,
                    SourceType = sourceType,
                    SourceId = normalizedSourceId,
                    Rating = rating.Value
                });
            }
            else
            {
                existingRating.Rating = rating.Value;
                existingRating.UpdatedAt = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
            await RefreshStatsAsync(sourceType, normalizedSourceId, cancellationToken);
        }

        public Task<ContentRatingStats?> GetStatsAsync(
            ContentSourceType sourceType,
            string sourceId,
            CancellationToken cancellationToken = default)
        {
            var normalizedSourceId = sourceId.Trim();

            return _dbContext.ContentRatingStats
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.SourceType == sourceType && x.SourceId == normalizedSourceId,
                    cancellationToken);
        }

        private async Task RefreshStatsAsync(
            ContentSourceType sourceType,
            string sourceId,
            CancellationToken cancellationToken)
        {
            var aggregate = await _dbContext.ContentRatings
                .Where(x => x.SourceType == sourceType && x.SourceId == sourceId)
                .GroupBy(_ => 1)
                .Select(x => new
                {
                    RatingCount = x.Count(),
                    AverageRating = x.Average(y => y.Rating)
                })
                .FirstOrDefaultAsync(cancellationToken);

            var stats = await _dbContext.ContentRatingStats
                .FirstOrDefaultAsync(
                    x => x.SourceType == sourceType && x.SourceId == sourceId,
                    cancellationToken);

            if (aggregate == null)
            {
                if (stats != null)
                {
                    _dbContext.ContentRatingStats.Remove(stats);
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }

                return;
            }

            if (stats == null)
            {
                stats = new ContentRatingStats
                {
                    SourceType = sourceType,
                    SourceId = sourceId
                };

                _dbContext.ContentRatingStats.Add(stats);
            }

            stats.AverageRating = aggregate.AverageRating;
            stats.RatingCount = aggregate.RatingCount;
            stats.UpdatedAt = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
