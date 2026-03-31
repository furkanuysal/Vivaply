using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Dashboard.Enums;

namespace Vivaply.API.Modules.Core.Dashboard.DTOs
{
    public class DashboardContentItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty; // TMDB ID, IGDB ID or GoogleBook ID

        [JsonPropertyName("type")]
        public DashboardItemType Type { get; set; } // "tv", "movie", "book", "game"

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; } // Poster or cover image URL

        [JsonPropertyName("season")]
        public int? Season { get; set; } // For TV shows

        [JsonPropertyName("episode")]
        public int? Episode { get; set; } // For TV shows

        [JsonPropertyName("currentValue")]
        public double? CurrentValue { get; set; } // Book: Page, Game: Hours played

        [JsonPropertyName("maxValue")]
        public double? MaxValue { get; set; } // Book: Total page

        [JsonPropertyName("userStatus")]
        public int UserStatus { get; set; } // Enum val (1: Watching, 2: Completed vs.)

        // Progression percent (Between 0-100)
        [JsonPropertyName("progressPercent")]
        public int? ProgressPercent { get; set; }

        [JsonPropertyName("lastUpdated")]
        public DateTime LastUpdated { get; set; }
    }
}
