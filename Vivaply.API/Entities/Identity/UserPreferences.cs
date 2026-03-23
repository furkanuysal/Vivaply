using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Identity
{
    public class UserPreferences
    {
        [Key]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        // Theme and Language Preferences
        public string Theme { get; set; } = "Light";
        public string Language { get; set; } = "en-US";

        // Time Format (IANA Format: "Europe/Istanbul")
        // Default is UTC
        public string TimeZone { get; set; } = "UTC";

        // Privacy Settings
        public ProfileVisibility ProfileVisibility { get; set; } = ProfileVisibility.Public;
        public ActivityVisibility ActivityVisibility { get; set; } = ActivityVisibility.Followers;
        public FollowPolicy FollowPolicy { get; set; } = FollowPolicy.AutoAccept;

        // Notifications
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;

        public User User { get; set; } = null!;
    }
}
