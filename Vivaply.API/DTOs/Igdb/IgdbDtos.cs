using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment.Igdb;

namespace Vivaply.API.DTOs.Igdb
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
        public long? FirstReleaseDateUnix { get; set; } // Unix Timestamp

        [JsonPropertyName("total_rating")]
        public double? TotalRating { get; set; } // 0-100

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

    // Basic ID and name class (Platform, Genre)
    public class IgdbSimpleItem
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
    }

    // Developers come wrapped in this structure
    public class IgdbCompanyWrapper
    {
        [JsonPropertyName("company")]
        public IgdbSimpleItem? Company { get; set; }

        [JsonPropertyName("developer")]
        public bool Developer { get; set; } // Get only developers
    }

    // Clean DTO for API responses
    public class GameContentDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public string? Summary { get; set; }
        public double VoteAverage { get; set; } // 0-10 scale
        public string? ReleaseDate { get; set; }

        // Lists
        public string Platforms { get; set; } = string.Empty;
        public string Developers { get; set; } = string.Empty;
        public string Genres { get; set; } = string.Empty;

        // User-specific fields
        public PlayStatus UserStatus { get; set; } = PlayStatus.None;
        public double? UserRating { get; set; }
        public string? UserReview { get; set; }
        public string? UserPlatform { get; set; }
        public double UserPlaytime { get; set; }
        public GameCompletionType CompletionType { get; set; } = GameCompletionType.None;
    }
}
