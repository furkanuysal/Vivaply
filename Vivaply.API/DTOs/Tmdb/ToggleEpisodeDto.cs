namespace Vivaply.API.DTOs.Tmdb
{
    public class ToggleEpisodeDto
    {
        public int TmdbShowId { get; set; }
        public int SeasonNumber { get; set; }
        public int EpisodeNumber { get; set; }
    }
}
