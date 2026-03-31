namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Library
{
    public class MediaLibraryDto
    {
        public List<TmdbContentDto> Tv { get; set; } = new();

        public List<TmdbContentDto> Movie { get; set; } = new();
    }
}
