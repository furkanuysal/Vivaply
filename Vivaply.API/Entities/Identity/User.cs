using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Finance;
using Vivaply.API.Entities.Gamification;

namespace Vivaply.API.Entities.Identity
{
    public class User

    {
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastLoginAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public UserProfile? Profile { get; set; }      // XP, Level, Stats
        public UserPreferences? Preferences { get; set; }  // Theme, Notifications, Privacy
        public Wallet? Wallet { get; set; }            // VivaCoin

        public ICollection<UserRefreshToken> RefreshTokens { get; set; } = new List<UserRefreshToken>();

    }
}
