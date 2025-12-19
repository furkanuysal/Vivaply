using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.DTOs.Entertainment.Results.Library
{
    public class MediaLibraryDto
    {
        public List<TmdbContentDto> Tv { get; set; } = new();

        public List<TmdbContentDto> Movie { get; set; } = new();
    }
}
