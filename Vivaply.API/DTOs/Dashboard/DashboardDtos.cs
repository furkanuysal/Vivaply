using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Dashboard
{
    // Main dashboard data transfer objects (DTOs)
    public class DashboardSummaryDto
    {
        // Active listening (Watching, Reading, Playing)
        [JsonPropertyName("continueWatching")]
        public List<DashboardItemDto> ContinueWatching { get; set; } = new(); // Tv and Movie

        [JsonPropertyName("continueReading")]
        public List<DashboardItemDto> ContinueReading { get; set; } = new();  // Book

        [JsonPropertyName("continuePlaying")]
        public List<DashboardItemDto> ContinuePlaying { get; set; } = new();  // Game

        // General Stats
        [JsonPropertyName("stats")]
        public DashboardStatsDto Stats { get; set; } = new();
    }

    // Common content item
    public class DashboardItemDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty; // TMDB ID, IGDB ID or GoogleBook ID

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty; // "tv", "movie", "book", "game"

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

        // Extra: Frontend url path
        [JsonPropertyName("routePath")]
        public string RoutePath => Type switch
        {
            "book" => $"/knowledge/book/{Id}",
            _ => $"/entertainment/{Type}/{Id}" // tv or movie
        };
    }

    // Dashboard statistics
    public class DashboardStatsDto
    {
        [JsonPropertyName("totalMovies")]
        public int TotalMovies { get; set; }

        [JsonPropertyName("totalEpisodes")]
        public int TotalEpisodes { get; set; }

        [JsonPropertyName("totalBooks")]
        public int TotalBooks { get; set; }

        [JsonPropertyName("totalGames")]
        public int TotalGames { get; set; }

        [JsonPropertyName("currentStreak")]
        public int CurrentStreak { get; set; }
    }
}