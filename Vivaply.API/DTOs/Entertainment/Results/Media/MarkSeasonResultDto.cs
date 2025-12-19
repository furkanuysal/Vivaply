namespace Vivaply.API.DTOs.Entertainment.Results.Media
{
    public class MarkSeasonResultDto
    {
        public int SeasonNumber { get; set; }

        // How many episodes added with this operation
        public int AddedEpisodeCount { get; set; }

        // UI feedback
        public string Message { get; set; } = string.Empty;
    }
}
