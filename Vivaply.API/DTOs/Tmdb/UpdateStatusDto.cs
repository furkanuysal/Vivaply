using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Tmdb
{
    public class UpdateStatusDto
    {
        [JsonPropertyName("tmdbId")]
        public int TmdbId { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = "tv";

        [JsonPropertyName("status")]
        public WatchStatus Status { get; set; }
    }
}
