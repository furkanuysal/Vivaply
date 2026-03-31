using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Media
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
