using System.Text.Json.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb;
using Vivaply.API.Modules.Core.Entertainment.Enums;

namespace Vivaply.API.Modules.Core.Entertainment.DTOs.Results
{
    public class TmdbContentDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("display_name")]
        public string DisplayName =>
            !string.IsNullOrEmpty(Name) ? Name : Title ?? "Bilinmiyor";

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        [JsonPropertyName("overview")]
        public string? Overview { get; set; }

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("vote_count")]
        public int VoteCount { get; set; }

        [JsonPropertyName("popularity")]
        public double Popularity { get; set; }

        [JsonPropertyName("first_air_date")]
        public string? FirstAirDate { get; set; }

        [JsonPropertyName("release_date")]
        public string? ReleaseDate { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("genres")]
        public List<TmdbGenreDto>? Genres { get; set; }

        [JsonPropertyName("genre_ids")]
        public List<int>? GenreIds { get; set; }

        [JsonPropertyName("display_date")]
        public string DisplayDate =>
            !string.IsNullOrEmpty(ReleaseDate) ? ReleaseDate : FirstAirDate ?? "";

        [JsonPropertyName("last_watched_at")]
        public DateTime? LastWatchedAt { get; set; }

        [JsonPropertyName("last_watched_season")]
        public int? LastWatchedSeason { get; set; }

        [JsonPropertyName("last_watched_episode")]
        public int? LastWatchedEpisode { get; set; }

        [JsonPropertyName("latest_episode")]
        public string? LatestEpisode { get; set; }

        [JsonPropertyName("latest_episode_air_date")]
        public string? LatestEpisodeAirDate { get; set; }

        [JsonPropertyName("user_status")]
        public WatchStatus UserStatus { get; set; } = WatchStatus.None;

        [JsonPropertyName("user_rating")]
        public double? UserRating { get; set; }

        [JsonPropertyName("user_review")]
        public string? UserReview { get; set; }

        [JsonPropertyName("viva_rating")]
        public double? VivaRating { get; set; }

        [JsonPropertyName("viva_rating_count")]
        public int VivaRatingCount { get; set; }

        [JsonPropertyName("list_count")]
        public int ListCount { get; set; }

        [JsonPropertyName("active_count")]
        public int ActiveCount { get; set; }

        [JsonPropertyName("completed_count")]
        public int CompletedCount { get; set; }

        [JsonPropertyName("completion_rate")]
        public double CompletionRate { get; set; }
    }
}
