namespace Vivaply.API.DTOs.Entertainment.Results.Media
{
    public class ToggleEpisodeResultDto
    {
        public int SeasonNumber { get; set; }
        public int EpisodeNumber { get; set; }

        // true = watched, false = unwatched
        public bool IsWatched { get; set; }

        // Short message for UI feedback
        public string Message { get; set; } = string.Empty;
    }
}
