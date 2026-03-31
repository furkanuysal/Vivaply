using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.External.Igdb
{
    public class IgdbCompanyWrapperDto
    {
        [JsonPropertyName("company")]
        public IgdbSimpleItemDto? Company { get; set; }

        [JsonPropertyName("developer")]
        public bool Developer { get; set; }
    }
}
