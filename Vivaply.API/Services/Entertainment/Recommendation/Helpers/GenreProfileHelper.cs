using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Services.Infrastructure.Serialization;

namespace Vivaply.API.Services.Entertainment.Recommendation.Helpers
{
    public static class GenreProfileHelper
    {
        public static IEnumerable<TmdbGenreDto> GetGenres(string? genresJson)
        {
            return JsonHelper.DeserializeList<TmdbGenreDto>(genresJson) ?? [];
        }
    }
}
