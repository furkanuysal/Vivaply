using System.Text.Json.Serialization;

namespace Vivaply.API.DTOs.Tmdb
{
    // TMDB Main Response Wrapper
    public class TmdbResponse<T>
    {
        [JsonPropertyName("results")]
        public List<T> Results { get; set; } = new();
    }

    // Show/Movie Info DTO
    public class TmdbContentDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        // Title for movies, Name for shows
        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        // Display Name (Name or Title)
        [JsonPropertyName("display_name")]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : Title ?? "Bilinmiyor";

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        [JsonPropertyName("overview")]
        public string? Overview { get; set; }

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("first_air_date")]
        public string? FirstAirDate { get; set; }

        [JsonPropertyName("release_date")]
        public string? ReleaseDate { get; set; }

        // Display Date (ReleaseDate or FirstAirDate)
        [JsonPropertyName("display_date")]
        public string DisplayDate => !string.IsNullOrEmpty(ReleaseDate) ? ReleaseDate : FirstAirDate ?? "";
    }

    // Detailed Show Info DTO
    public class TmdbShowDetailDto : TmdbContentDto
    {
        [JsonPropertyName("seasons")]
        public List<TmdbSeasonDto> Seasons { get; set; } = new();
    }

    public class TmdbSeasonDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("season_number")]
        public int SeasonNumber { get; set; }

        [JsonPropertyName("episode_count")]
        public int EpisodeCount { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }
    }
}