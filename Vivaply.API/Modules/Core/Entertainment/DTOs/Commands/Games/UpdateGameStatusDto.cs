using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games
{

    // Update Play Status
    public class UpdateGameStatusDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("status")]
        public PlayStatus Status { get; set; }
    }
}
