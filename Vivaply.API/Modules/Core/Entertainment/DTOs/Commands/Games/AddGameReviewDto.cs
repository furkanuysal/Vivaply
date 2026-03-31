using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games
{
    // Review Game
    public class AddGameReviewDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("review")]
        public string Review { get; set; } = string.Empty;
    }
}
