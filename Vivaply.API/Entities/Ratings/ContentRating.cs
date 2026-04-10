using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Ratings.Enums;

namespace Vivaply.API.Entities.Ratings
{
    public class ContentRating
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public ContentSourceType SourceType { get; set; }
        public string SourceId { get; set; } = string.Empty;

        public double Rating { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
