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
        public string Language { get; set; } = "tr-TR";

        // Time Format (IANA Format: "Europe/Istanbul")
        // Default is UTC
        public string TimeZone { get; set; } = "UTC";

        // Privacy Settings
        public int ProfileVisibility { get; set; } = 0;
        public int ActivityVisibility { get; set; } = 1;

        // Notifications
        public bool EmailNotifications { get; set; } = true;
        public bool PushNotifications { get; set; } = true;

        public User? User { get; set; }
    }
}
