using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Services.Entertainment.Media.Helpers;

namespace Vivaply.API.Services.Entertainment.Recommendation.Helpers
{
    public static class GenreProfileHelper
    {
        public static IEnumerable<TmdbGenreDto> GetGenres(string? genresJson)
        {
            return GenreJsonHelper.Deserialize(genresJson)
                   ?? Enumerable.Empty<TmdbGenreDto>();
        }
    }
}
