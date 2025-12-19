using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Entertainment.Commands.Media
{
    public class UpdateMediaStatusDto
    {
        [JsonPropertyName("tmdbId")]
        public int TmdbId { get; set; }

        [JsonPropertyName("type")]
        public string Type { get; set; } = "tv";

        [JsonPropertyName("status")]
        public WatchStatus Status { get; set; }
    }
}
