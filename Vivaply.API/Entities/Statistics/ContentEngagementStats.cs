using Vivaply.API.Modules.Core.Ratings.Enums;

namespace Vivaply.API.Entities.Statistics
{
    public class ContentEngagementStats
    {
        public Guid Id { get; set; }

        public ContentSourceType SourceType { get; set; }
        public string SourceId { get; set; } = string.Empty;

        public int ListCount { get; set; }
        public int ActiveCount { get; set; }
        public int CompletedCount { get; set; }
        public int PlannedCount { get; set; }
        public int DroppedCount { get; set; }
        public int OnHoldCount { get; set; }

        public double CompletionRate { get; set; }
        public DateTime LastAggregatedAt { get; set; } = DateTime.UtcNow;
    }
}
