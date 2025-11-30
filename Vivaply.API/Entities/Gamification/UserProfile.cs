using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Entities.Gamification
{
    public class UserProfile
    {
        [Key]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        [MaxLength(200)]
        public string? Bio { get; set; }
        [MaxLength(50)]
        public string? Location { get; set; }

        // Leveling System
        public int Level { get; set; } = 1;

        // Current XP for the current level
        public long CurrentXp { get; set; } = 0;

        // Total XP accumulated
        public long TotalXp { get; set; } = 0;

        // Streak system
        public int CurrentStreak { get; set; } = 0;
        public int LongestStreak { get; set; } = 0;

        // Checking when the streak was last updated
        public DateTime? LastStreakUpdate { get; set; }

        // Attributes / Stats
        public int Strength { get; set; } = 1;
        public int Intellect { get; set; } = 1;
        public int Stamina { get; set; } = 1;
        public int Charisma { get; set; } = 1;

        public User? User { get; set; }
    }
}
