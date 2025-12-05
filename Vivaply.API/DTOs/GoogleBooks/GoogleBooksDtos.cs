using System.Text.Json.Serialization;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.DTOs.GoogleBooks
{
    public class GoogleBooksResponse
    {
        [JsonPropertyName("totalItems")]
        public int TotalItems { get; set; }

        [JsonPropertyName("items")]
        public List<GoogleBookItem>? Items { get; set; }
    }

    public class GoogleBookItem
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("volumeInfo")]
        public VolumeInfo? VolumeInfo { get; set; }
    }

    public class VolumeInfo
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("authors")]
        public List<string>? Authors { get; set; }

        [JsonPropertyName("publishedDate")]
        public string? PublishedDate { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("pageCount")]
        public int PageCount { get; set; }

        [JsonPropertyName("categories")]
        public List<string>? Categories { get; set; }

        [JsonPropertyName("averageRating")]
        public double AverageRating { get; set; }

        [JsonPropertyName("imageLinks")]
        public ImageLinks? ImageLinks { get; set; }

        [JsonPropertyName("language")]
        public string? Language { get; set; }
    }

    public class ImageLinks
    {
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }

        [JsonPropertyName("smallThumbnail")]
        public string? SmallThumbnail { get; set; }
    }

    // Custom DTO to map Google Books data to our application's format
    public class BookContentDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public List<string> Authors { get; set; } = new();
        public string? CoverUrl { get; set; }
        public string? Description { get; set; }
        public int PageCount { get; set; }
        public string? PublishedDate { get; set; }
        public double AverageRating { get; set; }

        // User-specific fields
        public ReadStatus UserStatus { get; set; } = ReadStatus.None; // PlanToRead, Reading, Completed etc.
        public int CurrentPage { get; set; } // Kaldığı sayfa
        public double? UserRating { get; set; }
        public string? UserReview { get; set; }
    }
}
