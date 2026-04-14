using Vivaply.API.Entities.Statistics;
using Vivaply.API.Modules.Core.Ratings.Enums;

namespace Vivaply.API.Modules.Core.Statistics.Services.Interfaces
{
    public interface IContentEngagementStatsService
    {
        Task<ContentEngagementStats?> GetStatsAsync(ContentSourceType sourceType, string sourceId);
        Task RebuildAsync(ContentSourceType sourceType, string sourceId);
    }
}
