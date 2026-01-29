using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.DTOs.Entertainment.Tmdb
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

        [JsonPropertyName("first_air_date")]
        public string? FirstAirDate { get; set; }

        [JsonPropertyName("release_date")]
        public string? ReleaseDate { get; set; }

        [JsonPropertyName("status")]
        public string? Status { get; set; }

        [JsonPropertyName("genres")]
        public List<TmdbGenreDto>? Genres { get; set; }

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

        [JsonPropertyName("user_status")]
        public WatchStatus UserStatus { get; set; } = WatchStatus.None;

        [JsonPropertyName("user_rating")]
        public double? UserRating { get; set; }

        [JsonPropertyName("user_review")]
        public string? UserReview { get; set; }
    }
}
