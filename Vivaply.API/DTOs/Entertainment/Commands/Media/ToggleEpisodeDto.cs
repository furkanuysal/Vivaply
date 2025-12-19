namespace Vivaply.API.DTOs.Entertainment.Commands.Media
{
    public class ToggleEpisodeDto
    {
        public int TmdbShowId { get; set; }
        public int SeasonNumber { get; set; }
        public int EpisodeNumber { get; set; }
    }
}
