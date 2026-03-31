using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games
{
    // Rate Game
    public class RateGameDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("rating")]
        public double Rating { get; set; }
    }
}
