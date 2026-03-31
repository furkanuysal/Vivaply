using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.External.Igdb
{
    public class IgdbImageDto
    {
        [JsonPropertyName("url")]
        public string? Url { get; set; }
    }
}
