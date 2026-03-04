using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Entities.Entertainment.Igdb
{
    public class UserGame
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public User? User { get; set; }

        public int IgdbId { get; set; } // IGDB ID
        public GameMetadata? Metadata { get; set; }

        // User's play status for the game
        public PlayStatus Status { get; set; } = PlayStatus.PlanToPlay;

        [Range(0, 10)]
        public double? UserRating { get; set; } // User's personal rating (0-10)

        // User platform preference
        [MaxLength(100)]
        public string? UserPlatform { get; set; }

        // User playtime in hours
        public double UserPlaytime { get; set; } = 0;

        // User's completion type
        public GameCompletionType CompletionType { get; set; } = GameCompletionType.None;

        [MaxLength(2000)]
        public string? Review { get; set; }

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        public DateTime? DateFinished { get; set; }
    }
}
