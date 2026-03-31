using System.Text.Json.Serialization;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb
{
    public class TmdbGenreResponse
    {
        [JsonPropertyName("genres")]
        public List<TmdbGenreDto> Genres { get; set; } = new();
    }

    public class TmdbGenreDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
    }
}
