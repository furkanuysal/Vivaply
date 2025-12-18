using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Tmdb
{
    public class UpdateEntertainmentDto
    {
        public int TmdbId { get; set; }
        public string Type { get; set; } = string.Empty; // "tv" or "movie"
        public WatchStatus Status { get; set; }
        public double? Rating { get; set; }
        public string? Review { get; set; }
    }
}
