using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games
{
    // Track Game
    public class TrackGameDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("coverUrl")]
        public string? CoverUrl { get; set; }

        [JsonPropertyName("releaseDate")]
        public string? ReleaseDate { get; set; }

        [JsonPropertyName("status")]
        public PlayStatus Status { get; set; }

        [JsonPropertyName("userPlatform")]
        public string? UserPlatform { get; set; }
    }
}
