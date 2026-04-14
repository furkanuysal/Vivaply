using System.Text.Json;
using Vivaply.API.Modules.Core.Knowledge.DTOs.GoogleBooks;
using Vivaply.API.Modules.Core.Knowledge.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Knowledge.Services.Implementations
{
    public class GoogleBooksService(HttpClient httpClient, IConfiguration config) : IGoogleBooksService
    {
        private readonly HttpClient _httpClient = httpClient;
        private readonly string _apiKey = config["GoogleBooksSettings:ApiKey"] ?? throw new Exception("Google Books API Key bulunamadı!");

        public async Task<List<BookContentDto>> SearchBooksAsync(
            string query,
            string? lang = null,
            int startIndex = 0)
        {
            var langParam = string.IsNullOrWhiteSpace(lang)
                ? ""
                : $"&langRestrict={lang}";

            var response = await _httpClient.GetAsync(
                $"volumes?q={query}{langParam}&startIndex={startIndex}&maxResults=20&key={_apiKey}"
            );

            if (!response.IsSuccessStatusCode)
                return new List<BookContentDto>();

            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GoogleBooksResponse>(content);

            if (result?.Items == null)
                return new List<BookContentDto>();

            return result.Items.Select(MapToDto).ToList();
        }

        public async Task<BookContentDto?> GetBookDetailsAsync(string googleBookId)
        {
            var response = await _httpClient.GetAsync($"volumes/{googleBookId}?key={_apiKey}");

            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();
            var item = JsonSerializer.Deserialize<GoogleBookItem>(content);

            return item != null ? MapToDto(item) : null;
        }

        // Yardımcı Mapping Metodu
        private BookContentDto MapToDto(GoogleBookItem item)
        {
            return new BookContentDto
            {
                Id = item.Id,
                Title = item.VolumeInfo?.Title ?? "Bilinmiyor",
                Authors = item.VolumeInfo?.Authors ?? new List<string>(),
                Description = item.VolumeInfo?.Description,
                PageCount = item.VolumeInfo?.PageCount ?? 0,
                PublishedDate = item.VolumeInfo?.PublishedDate,
                AverageRating = NormalizeGoogleBooksRating(item.VolumeInfo?.AverageRating),
                RatingsCount = item.VolumeInfo?.RatingsCount ?? 0,
                CoverUrl = item.VolumeInfo?.ImageLinks?.Thumbnail?.Replace("http://", "https://")
            };
        }

        private static double NormalizeGoogleBooksRating(double? averageRating)
        {
            if (!averageRating.HasValue || averageRating.Value <= 0)
                return 0;

            return Math.Round(Math.Clamp(averageRating.Value * 2, 0, 10), 1);
        }
    }
}
