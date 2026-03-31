using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Interfaces
{
    public interface IRecommendationService
    {
        Task<RecommendationResponseDto> GetRecommendationsAsync(Guid userId, string language = "en-US");
    }
}
