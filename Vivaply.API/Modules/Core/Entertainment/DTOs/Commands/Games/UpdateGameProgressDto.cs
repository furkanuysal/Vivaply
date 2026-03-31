using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games
{
    public class UpdateGameProgressDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("userPlaytime")]
        public double UserPlaytime { get; set; }

        [JsonPropertyName("completionType")]
        public GameCompletionType CompletionType { get; set; }

        [JsonPropertyName("userPlatform")]
        public string? UserPlatform { get; set; }

        [JsonPropertyName("userRating")]
        public double? UserRating { get; set; }
    }
}
