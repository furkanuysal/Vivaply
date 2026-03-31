using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.External.Igdb
{
    public class IgdbGameDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string? Summary { get; set; }

        [JsonPropertyName("cover")]
        public IgdbImageDto? Cover { get; set; }

        [JsonPropertyName("first_release_date")]
        public long? FirstReleaseDateUnix { get; set; }

        [JsonPropertyName("total_rating")]
        public double? TotalRating { get; set; } // 0–100

        [JsonPropertyName("platforms")]
        public List<IgdbSimpleItemDto>? Platforms { get; set; }

        [JsonPropertyName("genres")]
        public List<IgdbSimpleItemDto>? Genres { get; set; }

        [JsonPropertyName("involved_companies")]
        public List<IgdbCompanyWrapperDto>? InvolvedCompanies { get; set; }
    }
}
