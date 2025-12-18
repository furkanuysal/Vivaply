using System.Text.Json.Serialization;
using Vivaply.API.Entities.Entertainment.Igdb;

namespace Vivaply.API.DTOs.Igdb
{
    // Track Game
    public class TrackGameDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("coverUrl")]
        public string? CoverUrl { get; set; }

        [JsonPropertyName("releaseDate")]
        public string? ReleaseDate { get; set; }

        [JsonPropertyName("status")]
        public PlayStatus Status { get; set; }

        [JsonPropertyName("userPlatform")]
        public string? UserPlatform { get; set; }
    }

    // Update Play Status
    public class UpdateGameStatusDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("status")]
        public PlayStatus Status { get; set; }
    }

    public class UpdateGameProgressDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("userPlaytime")]
        public double UserPlaytime { get; set; }

        [JsonPropertyName("completionType")]
        public GameCompletionType CompletionType { get; set; }

        [JsonPropertyName("userPlatform")]
        public string? UserPlatform { get; set; }

        [JsonPropertyName("userRating")]
        public double? UserRating { get; set; }
    }

    // Rate Game
    public class RateGameDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("rating")]
        public double Rating { get; set; }
    }

    // Review Game
    public class AddGameReviewDto
    {
        [JsonPropertyName("igdbId")]
        public int IgdbId { get; set; }

        [JsonPropertyName("review")]
        public string Review { get; set; } = string.Empty;
    }
}
