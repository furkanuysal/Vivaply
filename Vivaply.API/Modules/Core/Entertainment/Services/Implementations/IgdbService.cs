using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Igdb;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class IgdbService(HttpClient httpClient, IConfiguration config) : IIgdbService
    {
        private readonly HttpClient _httpClient = httpClient;
        private readonly IConfiguration _config = config;

        // Remember the token and its expiry
        private static string? _accessToken;
        private static DateTime _tokenExpiry;

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
        private async Task<List<IgdbGameDto>> SendQueryAsync(string endpoint, string queryBody)
        {
            await EnsureAccessTokenAsync();

            var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
            request.Headers.Add("Client-ID", _config["IgdbSettings:ClientId"]);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
            request.Content = new StringContent(queryBody, Encoding.UTF8, "text/plain");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode) return [];

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            return JsonSerializer.Deserialize<List<IgdbGameDto>>(content, options) ?? [];
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

            var game = (await SendQueryAsync("games", body)).FirstOrDefault();
            return game == null ? null : MapToDto(game);
        }

        // Mapper (IGDB -> DTO)
        private GameContentDto MapToDto(IgdbGameDto game)
        {
            var coverUrl = game.Cover?.Url?.Replace("t_thumb", "t_cover_big");
            if (coverUrl != null && !coverUrl.StartsWith("https:"))
                coverUrl = "https:" + coverUrl;

            DateTime? releaseDate = null;
            if (game.FirstReleaseDateUnix.HasValue)
            {
                releaseDate = DateTimeOffset
                    .FromUnixTimeSeconds(game.FirstReleaseDateUnix.Value)
                    .UtcDateTime;
            }

            var developers = game.InvolvedCompanies?
                .Where(c => c.Developer)
                .Select(c => c.Company?.Name)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList() ?? [];

            return new GameContentDto
            {
                Id = game.Id,
                Title = game.Name,
                CoverUrl = coverUrl,
                Summary = game.Summary,
                VoteAverage = game.TotalRating.HasValue
                    ? Math.Round(game.TotalRating.Value / 10, 1)
                    : 0,
                ReleaseDate = releaseDate,
                Platforms = string.Join(", ", game.Platforms?.Select(p => p.Name) ?? Array.Empty<string>()),
                Genres = string.Join(", ", game.Genres?.Select(g => g.Name) ?? Array.Empty<string>()),
                Developers = string.Join(", ", developers)
            };
        }
    }
}
