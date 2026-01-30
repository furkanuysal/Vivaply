using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.DTOs.Entertainment.Recommendation
{
    public class RecommendationResponseDto
    {
        public List<TmdbContentDto> Tv { get; set; } = new();
        public List<TmdbContentDto> Movies { get; set; } = new();
    }
}
