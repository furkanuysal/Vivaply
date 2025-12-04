using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Entities.Entertainment
{
    public class UserMovie
    {
        public Guid Id { get; set; }

        // Which User
        public Guid UserId { get; set; }
        public User? User { get; set; }

        // TMBD Movie ID
        public int TmdbMovieId { get; set; }

        // Cached Basic Movie Info
        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PosterPath { get; set; }
        public double VoteAverage { get; set; }

        // Watch Status
        public WatchStatus Status { get; set; } = WatchStatus.PlanToWatch;

        // Production status
        [MaxLength(50)]
        public string? ProductionStatus { get; set; }

        public DateTime? WatchedAt { get; set; } // When watched

        [MaxLength(20)]
        public string? ReleaseDate { get; set; }

        // Rating given by user
        [Range(1, 10)]
        public double? UserRating { get; set; }

        // Review given by user
        [MaxLength(1000)]
        public string? Review { get; set; }
    }
}