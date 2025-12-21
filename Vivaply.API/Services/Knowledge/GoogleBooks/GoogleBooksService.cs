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

        public async Task<List<BookContentDto>> SearchBooksAsync(string query, string lang = "en")
        {
            // &langRestrict={lang} parametresi ile dile göre arama yapılabilir
            var response = await _httpClient.GetAsync($"volumes?q={query}&key={_apiKey}&maxResults=20");

            if (!response.IsSuccessStatusCode) return new List<BookContentDto>();

            var content = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<GoogleBooksResponse>(content);

            if (result?.Items == null) return new List<BookContentDto>();

            // Google formatını kendi DTO'muza çeviriyoruz (Mapping)
            return result.Items.Select(item => MapToDto(item)).ToList();
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
