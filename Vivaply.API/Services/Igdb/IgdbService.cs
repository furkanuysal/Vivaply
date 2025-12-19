using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Vivaply.API.DTOs.Entertainment.Igdb;

namespace Vivaply.API.Services.Igdb
{
    public class IgdbService : IIgdbService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _config;

        // Remember the token and its expiry
        private static string? _accessToken;
        private static DateTime _tokenExpiry;

        public IgdbService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _config = config;
        }

        // Ensuring we have a valid access token
        private async Task EnsureAccessTokenAsync()
        {
            if (!string.IsNullOrEmpty(_accessToken) && DateTime.UtcNow < _tokenExpiry) return;

            var clientId = _config["IgdbSettings:ClientId"];
            var clientSecret = _config["IgdbSettings:ClientSecret"];

            // Credential request
            using var authClient = new HttpClient();
            var response = await authClient.PostAsync(
                $"https://id.twitch.tv/oauth2/token?client_id={clientId}&client_secret={clientSecret}&grant_type=client_credentials",
                null);

            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(content);

            _accessToken = json.RootElement.GetProperty("access_token").GetString();
            var expiresIn = json.RootElement.GetProperty("expires_in").GetInt32();
            _tokenExpiry = DateTime.UtcNow.AddSeconds(expiresIn - 3600); // Expire 1 hour before actual expiry
        }

        // Generic query sender
        private async Task<List<IgdbGame>> SendQueryAsync(string endpoint, string queryBody)
        {
            await EnsureAccessTokenAsync();

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Add("Client-ID", _config["IgdbSettings:ClientId"]);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            request.Content = new StringContent(queryBody, Encoding.UTF8, "text/plain");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return new List<IgdbGame>();

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<IgdbGame>>(content, options) ?? new List<IgdbGame>();
        }

        // Search Games
        public async Task<List<GameContentDto>> SearchGamesAsync(string query)
        {
            // IGDB Query Language (Apicalypse)
            var body = $@"
                search ""{query}"";
                fields name, cover.url, first_release_date, total_rating, summary, 
                       platforms.name, genres.name, involved_companies.company.name, involved_companies.developer;
                limit 20;";

            var games = await SendQueryAsync("games", body);
            return games.Select(MapToDto).ToList();
        }

        // Trending Games
        public async Task<List<GameContentDto>> GetTrendingGamesAsync()
        {
            var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            var sixMonthsAgo = DateTimeOffset.UtcNow.AddMonths(-6).ToUnixTimeSeconds();

            var body = $@"
                fields name, cover.url, first_release_date, total_rating, summary,
                       platforms.name, genres.name, involved_companies.company.name, involved_companies.developer;
                where first_release_date > {sixMonthsAgo} & first_release_date < {now} & total_rating > 70;
                sort total_rating desc;
                limit 20;";

            var games = await SendQueryAsync("games", body);
            return games.Select(MapToDto).ToList();
        }

        // Get Game Detail by ID
        public async Task<GameContentDto?> GetGameDetailAsync(int id)
        {
            var body = $@"
                fields name, cover.url, first_release_date, total_rating, summary,
                       platforms.name, genres.name, involved_companies.company.name, involved_companies.developer;
                where id = {id};";

            var games = await SendQueryAsync("games", body);
            return games.FirstOrDefault() != null ? MapToDto(games.First()) : null;
        }

        // Mapper (IGDB -> DTO)
        private GameContentDto MapToDto(IgdbGame game)
        {
            // Cover Enlarger (t_thumb -> t_cover_big)
            var coverUrl = game.Cover?.Url?.Replace("t_thumb", "t_cover_big");
            if (coverUrl != null && !coverUrl.StartsWith("https:")) coverUrl = "https:" + coverUrl;

            // Date Conversion (Unix -> String)
            string dateStr = "";
            if (game.FirstReleaseDateUnix.HasValue)
            {
                dateStr = DateTimeOffset.FromUnixTimeSeconds(game.FirstReleaseDateUnix.Value).ToString("yyyy-MM-dd");
            }

            // Developer Extraction
            var dev = game.InvolvedCompanies?.FirstOrDefault(c => c.Developer)?.Company?.Name ?? "";

            return new GameContentDto
            {
                Id = game.Id,
                Title = game.Name,
                CoverUrl = coverUrl,
                Summary = game.Summary,
                VoteAverage = game.TotalRating.HasValue ? Math.Round(game.TotalRating.Value / 10, 1) : 0, // Convert the 100-based system to a 10-based system
                ReleaseDate = dateStr,
                Platforms = string.Join(", ", game.Platforms?.Select(p => p.Name) ?? Array.Empty<string>()),
                Genres = string.Join(", ", game.Genres?.Select(g => g.Name) ?? Array.Empty<string>()),
                Developers = dev
            };
        }
    }
}
