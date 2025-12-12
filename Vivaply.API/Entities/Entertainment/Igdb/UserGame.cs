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

        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? CoverUrl { get; set; } // Cover Image URL

        [MaxLength(50)]
        public string? ReleaseDate { get; set; } // Release Date as string

        // Additional info fields for caching 
        [MaxLength(500)]
        public string? Platforms { get; set; } // "PC, PS5, Xbox Series X"

        [MaxLength(500)]
        public string? Developers { get; set; } // "FromSoftware"

        [MaxLength(500)]
        public string? Genres { get; set; } // "RPG, Adventure"

        // User's play status for the game
        public PlayStatus Status { get; set; } = PlayStatus.PlanToPlay;

        [Range(0, 10)]
        public double? UserRating { get; set; } // User's personal rating (0-10)

        public double VoteAverage { get; set; } // IGDB Average Rating (0-100, we'll convert to 0-10 later)

        [MaxLength(2000)]
        public string? Review { get; set; }

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        public DateTime? DateFinished { get; set; }
    }
}
