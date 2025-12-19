using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Entertainment.Commands.Media
{
    public class AddMediaReviewDto
    {
        [JsonPropertyName("tmdbId")]
        public int TmdbId { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = "tv";

        [JsonPropertyName("review")]
        public string Review { get; set; } = string.Empty;
    }
}
