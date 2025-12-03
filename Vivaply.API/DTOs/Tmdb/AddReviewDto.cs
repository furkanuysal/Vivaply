using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Tmdb
{
    public class AddReviewDto
    {
        [JsonPropertyName("tmdbId")]
        public int TmdbId { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = "tv";

        [JsonPropertyName("review")]
        public string Review { get; set; } = string.Empty;
    }
}
