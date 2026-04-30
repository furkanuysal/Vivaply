using Vivaply.API.Modules.Core.Notifications.Enums;

namespace Vivaply.API.Entities.Identity
{
    public class UserNotification
    {
        public Guid Id { get; set; }

        public NotificationType Type { get; set; }
        public NotificationCategory Category { get; set; } = NotificationCategory.Social;

        public Guid RecipientUserId { get; set; }
        public User? RecipientUser { get; set; }

        public Guid? ActorUserId { get; set; }
        public User? ActorUser { get; set; }

        public Guid? PostId { get; set; }
        public UserPost? Post { get; set; }

        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
