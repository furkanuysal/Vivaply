using System.Text.Json;
using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Media.Helpers
{
    public static class GenreJsonHelper
    {
        private static readonly JsonSerializerOptions Options = new()
        {
            PropertyNameCaseInsensitive = true
        };

        public static string? Serialize(List<TmdbGenreDto>? genres)
        {
            if (genres == null || genres.Count == 0)
                return null;

            return JsonSerializer.Serialize(genres, Options);
        }

        public static List<TmdbGenreDto>? Deserialize(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
                return null;

            return JsonSerializer.Deserialize<List<TmdbGenreDto>>(json, Options);
        }
    }
}
