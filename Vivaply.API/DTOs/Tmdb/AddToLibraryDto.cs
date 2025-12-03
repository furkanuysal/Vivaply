using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Tmdb
{
    public class AddToLibraryDto
    {
        public int TmdbId { get; set; }
        public string Type { get; set; } = "tv";
        public string Title { get; set; } = string.Empty;
        public string? PosterPath { get; set; }
        public string? Date { get; set; }

        public WatchStatus Status { get; set; }
    }
}
