using System.Text.Json.Serialization;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.DTOs.Knowledge.Commands.Book
{
    public class AddBookDto
    {
        [JsonPropertyName("googleBookId")]
        public string GoogleBookId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("authors")]
        public List<string> Authors { get; set; } = new();

        [JsonPropertyName("coverUrl")]
        public string? CoverUrl { get; set; }

        [JsonPropertyName("pageCount")]
        public int PageCount { get; set; }

        [JsonPropertyName("status")]
        public ReadStatus Status { get; set; }
    }

    // Read status update (Example: PlanToRead -> Reading)
    public class UpdateBookStatusDto
    {
        [JsonPropertyName("googleBookId")]
        public string GoogleBookId { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public ReadStatus Status { get; set; }
    }

    // Current page update (Ex: I am on page 120.)
    public class UpdateBookProgressDto
    {
        [JsonPropertyName("googleBookId")]
        public string GoogleBookId { get; set; } = string.Empty;

        [JsonPropertyName("currentPage")]
        public int CurrentPage { get; set; }
    }

    // User rating
    public class RateBookDto
    {
        [JsonPropertyName("googleBookId")]
        public string GoogleBookId { get; set; } = string.Empty;
        [JsonPropertyName("rating")]
        public double Rating { get; set; }
    }

    // User review
    public class ReviewBookDto
    {
        [JsonPropertyName("googleBookId")]
        public string GoogleBookId { get; set; } = string.Empty;
        [JsonPropertyName("review")]
        public string Review { get; set; } = string.Empty;
    }
}
