using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Dashboard.DTOs
{
    // Main dashboard data transfer objects (DTOs)
    public class DashboardSummaryDto
    {
        // Active listening (Watching, Reading, Playing)
        [JsonPropertyName("continueWatching")]
        public List<DashboardContentItemDto> ContinueWatching { get; set; } = new(); // Tv and Movie

        [JsonPropertyName("continueReading")]
        public List<DashboardContentItemDto> ContinueReading { get; set; } = new();  // Book

        [JsonPropertyName("continuePlaying")]
        public List<DashboardContentItemDto> ContinuePlaying { get; set; } = new();  // Game

        // General Stats
        [JsonPropertyName("stats")]
        public DashboardStatsDto Stats { get; set; } = new();
    }
}