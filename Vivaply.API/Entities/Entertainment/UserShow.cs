using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Entities.Entertainment
{
    public class UserShow
    {
        public Guid Id { get; set; }

        // User
        public Guid UserId { get; set; }
        public User? User { get; set; }

        // TMDB Show ID
        public int TmdbShowId { get; set; }

        // Keep basic show info for quick access
        [MaxLength(200)]
        public string ShowName { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PosterPath { get; set; } // Poster path

        public WatchStatus Status { get; set; } = WatchStatus.Watching;

        [Range(1, 10)]
        public int? UserRating { get; set; }

        // User Review
        [MaxLength(1000)]
        public string? Review { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        // Watched Episodes
        public List<WatchedEpisode> WatchedEpisodes { get; set; } = new();
    }
}