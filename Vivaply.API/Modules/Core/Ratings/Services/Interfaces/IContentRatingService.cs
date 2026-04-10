using Vivaply.API.Entities.Ratings;
using Vivaply.API.Modules.Core.Ratings.Enums;

namespace Vivaply.API.Modules.Core.Ratings.Services.Interfaces
{
    public interface IContentRatingService
    {
        Task SetRatingAsync(
            Guid userId,
            ContentSourceType sourceType,
            string sourceId,
            double? rating,
            CancellationToken cancellationToken = default);

        Task<ContentRatingStats?> GetStatsAsync(
            ContentSourceType sourceType,
            string sourceId,
            CancellationToken cancellationToken = default);
    }
}
