using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment;

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

        // Show Status (e.g., "Ended", "Returning Series")
        [JsonPropertyName("status")]
        public string? Status { get; set; }

        // Display Date (ReleaseDate or FirstAirDate)
        [JsonPropertyName("display_date")]
        public string DisplayDate => !string.IsNullOrEmpty(ReleaseDate) ? ReleaseDate : FirstAirDate ?? "";

        [JsonPropertyName("last_watched")]
        public string? LastWatched { get; set; }

        [JsonPropertyName("latest_episode")]
        public string? LatestEpisode { get; set; }

        [JsonPropertyName("user_status")]
        public WatchStatus UserStatus { get; set; } = WatchStatus.None;

        [JsonPropertyName("user_rating")]
        public double? UserRating { get; set; }

        [JsonPropertyName("user_review")]
        public string? UserReview { get; set; }
    }

    // Detailed Show Info DTO
    public class TmdbShowDetailDto : TmdbContentDto
    {
        [JsonPropertyName("seasons")]
        public List<TmdbSeasonDto> Seasons { get; set; } = new();

        [JsonPropertyName("last_episode_to_air")]
        public TmdbEpisodeDto? LastEpisodeToAir { get; set; }

        [JsonPropertyName("next_episode_to_air")]
        public TmdbEpisodeDto? NextEpisodeToAir { get; set; }
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

    public class TmdbSeasonDetailDto
    {
        [JsonPropertyName("_id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("season_number")]
        public int SeasonNumber { get; set; }

        [JsonPropertyName("episodes")]
        public List<TmdbEpisodeDto> Episodes { get; set; } = new();
    }

    // Episode Info DTO
    public class TmdbEpisodeDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("episode_number")]
        public int EpisodeNumber { get; set; }

        [JsonPropertyName("season_number")]
        public int SeasonNumber { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("overview")]
        public string? Overview { get; set; }

        [JsonPropertyName("still_path")]
        public string? StillPath { get; set; }

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("air_date")]
        public string? AirDate { get; set; }

        [JsonPropertyName("is_watched")]
        public bool IsWatched { get; set; } = false;
    }
}