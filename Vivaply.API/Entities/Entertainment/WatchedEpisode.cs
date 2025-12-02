using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.Entities.Entertainment
{
    public class WatchedEpisode
    {
        public Guid Id { get; set; }

        // UserShow ID
        public Guid UserShowId { get; set; }
        public UserShow? UserShow { get; set; }

        // Episode Info
        public int SeasonNumber { get; set; }
        public int EpisodeNumber { get; set; }

        public DateTime WatchedAt { get; set; } = DateTime.UtcNow;

        [Range(1, 10)]
        public int? UserRating { get; set; }

        [MaxLength(500)]
        public string? Review { get; set; }
    }
}