using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Entertainment.Tmdb;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Entertainment.Enums;

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
        public ShowMetadata? Metadata { get; set; }

        public WatchStatus Status { get; set; } = WatchStatus.Watching;

        [Range(1, 10)]
        public double? UserRating { get; set; }

        // User Review
        [MaxLength(1000)]
        public string? Review { get; set; }

        public DateTime StartedAt { get; set; } = DateTime.UtcNow;

        // Dashboard Optimization
        public DateTime? LastWatchedAt { get; set; }
        public int? LastWatchedSeason { get; set; }
        public int? LastWatchedEpisode { get; set; }

        // Watched Episodes
        public List<WatchedEpisode> WatchedEpisodes { get; set; } = [];
    }
}