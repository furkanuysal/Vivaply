using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Entertainment.Commands.Media
{
    public class UpdateMediaProgressDto
    {
        public int TmdbId { get; set; }
        public string Type { get; set; } = string.Empty; // "tv" or "movie"
        public WatchStatus Status { get; set; }
        public double? Rating { get; set; }
        public string? Review { get; set; }
    }
}
