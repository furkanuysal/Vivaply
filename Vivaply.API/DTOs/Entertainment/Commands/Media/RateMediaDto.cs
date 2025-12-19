using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Entertainment.Commands.Media
{
    public class RateMediaDto
    {
        [JsonPropertyName("tmdbId")]
        public int TmdbId { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = "tv";

        [JsonPropertyName("rating")]
        public double Rating { get; set; }
    }
}
