using System.Text.Json;
using Vivaply.API.DTOs.Knowledge.GoogleBooks;

namespace Vivaply.API.Services.Knowledge.GoogleBooks
{
    public class GoogleBooksService : IGoogleBooksService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GoogleBooksService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["GoogleBooksSettings:ApiKey"] ?? throw new Exception("Google Books API Key bulunamadı!");
        }

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
                AverageRating = item.VolumeInfo?.AverageRating ?? 0,
                CoverUrl = item.VolumeInfo?.ImageLinks?.Thumbnail?.Replace("http://", "https://")
            };
        }
    }
}
