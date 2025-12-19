using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Entertainment.Results.Media
{
    public class WatchNextEpisodeResultDto
    {
        public int SeasonNumber { get; set; }
        public int EpisodeNumber { get; set; }

        // If series completed with this episode, then change status
        public WatchStatus NewStatus { get; set; }

        // UI feedback (örn: "S3 E7 is watched")
        public string Message { get; set; } = string.Empty;
    }
}
