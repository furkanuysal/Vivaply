using Vivaply.API.Entities.Entertainment.Igdb;

namespace Vivaply.API.DTOs.Entertainment.Igdb
{
    public class GameContentDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverUrl { get; set; }
        public string? Summary { get; set; }

        // Normalized values
        public double VoteAverage { get; set; } // 0–10
        public string? ReleaseDate { get; set; }

        // Flattened lists (UI-friendly)
        public string Platforms { get; set; } = string.Empty;
        public string Developers { get; set; } = string.Empty;
        public string Genres { get; set; } = string.Empty;

        // User-specific
        public PlayStatus UserStatus { get; set; } = PlayStatus.None;
        public double? UserRating { get; set; }
        public string? UserReview { get; set; }
        public string? UserPlatform { get; set; }
        public double UserPlaytime { get; set; }
        public GameCompletionType CompletionType { get; set; } = GameCompletionType.None;
    }
}
