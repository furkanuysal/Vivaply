using System.ComponentModel.DataAnnotations;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Entities.Identity
{
    public class UserActivity
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }
        public UserPost? Post { get; set; }

        public ActivityType Type { get; set; }

        [MaxLength(50)]
        public string SubjectType { get; set; } = string.Empty;

        [MaxLength(100)]
        public string SubjectId { get; set; } = string.Empty;

        [MaxLength(50)]
        public string? ParentEntityType { get; set; }

        [MaxLength(100)]
        public string? ParentEntityId { get; set; }

        [MaxLength(50)]
        public string? SourceEntityType { get; set; }

        [MaxLength(100)]
        public string? SourceEntityId { get; set; }

        public string PayloadJson { get; set; } = "{}";

        [MaxLength(200)]
        public string? AggregateKey { get; set; }

        public DateTime? AggregationWindowEndsAt { get; set; }

        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;

        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }
    }
}
