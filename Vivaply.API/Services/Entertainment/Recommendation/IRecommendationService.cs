using Vivaply.API.DTOs.Entertainment.Recommendation;

namespace Vivaply.API.Services.Entertainment.Recommendation
{
    public interface IRecommendationService
    {
        Task<RecommendationResponseDto> GetRecommendationsAsync(Guid userId, string language = "en-US");
    }
}
