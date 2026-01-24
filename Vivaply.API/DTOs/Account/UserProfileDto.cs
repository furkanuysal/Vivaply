namespace Vivaply.API.DTOs.Account
{
    public class UserProfileDto
    {
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
    }
}
