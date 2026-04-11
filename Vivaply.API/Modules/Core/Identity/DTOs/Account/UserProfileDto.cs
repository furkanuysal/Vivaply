using Vivaply.API.Modules.Core.Identity.Enums;

namespace Vivaply.API.Modules.Core.Identity.DTOs.Account
{
    public class UserProfileDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public string? Location { get; set; }

        // Gamification
        public int Level { get; set; }
        public long CurrentXp { get; set; }
        public long TotalXp { get; set; }
        public int CurrentStreak { get; set; }

        // Finance
        public decimal Money { get; set; }

        // Social
        public bool IsCurrentUser { get; set; }
        public FollowStatus? RelationStatus { get; set; }
        public FollowPolicy? FollowPolicy { get; set; }
        public bool IsFollowingCurrentUser { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
    }
}
