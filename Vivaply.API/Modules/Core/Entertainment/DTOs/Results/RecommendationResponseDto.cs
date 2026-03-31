namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Results
{
    public class RecommendationResponseDto
    {
        public List<TmdbContentDto> Tv { get; set; } = [];
        public List<TmdbContentDto> Movies { get; set; } = [];
    }
}
