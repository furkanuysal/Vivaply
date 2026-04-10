using Vivaply.API.Modules.Core.Ratings.Enums;

namespace Vivaply.API.Entities.Ratings
{
    public class ContentRatingStats
    {
        public Guid Id { get; set; }

        public ContentSourceType SourceType { get; set; }
        public string SourceId { get; set; } = string.Empty;

        public double AverageRating { get; set; }
        public int RatingCount { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
