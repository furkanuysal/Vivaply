using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Media
{
    public class AddMediaToLibraryDto
    {
        public int TmdbId { get; set; }
        public string Type { get; set; } = "tv";
        public string Title { get; set; } = string.Empty;
        public string? PosterPath { get; set; }
        public string? Date { get; set; }

        public WatchStatus Status { get; set; }
    }
}
