using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Entertainment.Tmdb;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Entertainment.Enums;

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
        public MovieMetadata? Metadata { get; set; }

        // Watch Status
        public WatchStatus Status { get; set; } = WatchStatus.PlanToWatch;

        public DateTime? WatchedAt { get; set; } // When watched

        // Rating given by user
        [Range(1, 10)]
        public double? UserRating { get; set; }

        // Review given by user
        [MaxLength(1000)]
        public string? Review { get; set; }
    }
}