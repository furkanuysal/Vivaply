using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Entertainment.Igdb
{
    public class IgdbGame
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("summary")]
        public string? Summary { get; set; }

        [JsonPropertyName("cover")]
        public IgdbImage? Cover { get; set; }

        [JsonPropertyName("first_release_date")]
        public long? FirstReleaseDateUnix { get; set; }

        [JsonPropertyName("total_rating")]
        public double? TotalRating { get; set; } // 0–100

        [JsonPropertyName("platforms")]
        public List<IgdbSimpleItem>? Platforms { get; set; }

        [JsonPropertyName("genres")]
        public List<IgdbSimpleItem>? Genres { get; set; }

        [JsonPropertyName("involved_companies")]
        public List<IgdbCompanyWrapper>? InvolvedCompanies { get; set; }
    }

    public class IgdbImage
    {
        [JsonPropertyName("url")]
        public string? Url { get; set; }
    }

    public class IgdbSimpleItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    public class IgdbCompanyWrapper
    {
        [JsonPropertyName("company")]
        public IgdbSimpleItem? Company { get; set; }

        [JsonPropertyName("developer")]
        public bool Developer { get; set; }
    }
}
