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
        public double? UserRating { get; set; }
        public double VoteAverage { get; set; }

        [MaxLength(50)]
        public string? ProductionStatus { get; set; }

        // User Review
        [MaxLength(1000)]
        public string? Review { get; set; }

        [MaxLength(20)]
        public string? FirstAirDate { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        [MaxLength(50)]
        public string? LatestEpisodeInfo { get; set; } // Example: "S5 E14"

        [MaxLength(20)]
        public string? NextAirDate { get; set; }

        // Dashboard Optimization
        public DateTime? LastWatchedAt { get; set; }
        public int? LastWatchedSeason { get; set; }
        public int? LastWatchedEpisode { get; set; }

        // Watched Episodes
        public List<WatchedEpisode> WatchedEpisodes { get; set; } = new();
    }
}