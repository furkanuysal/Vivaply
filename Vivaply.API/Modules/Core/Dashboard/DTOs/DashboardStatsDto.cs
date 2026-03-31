using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Dashboard.DTOs
{
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