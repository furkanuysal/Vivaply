using System.Text.Json;
using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Tmdb
{
    public class TmdbService : ITmdbService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public TmdbService(HttpClient httpClient, IConfiguration config)
        {
            _httpClient = httpClient;
            _apiKey = config["TmdbSettings:ApiKey"] ?? throw new Exception("TMDB API Key not found!");
        }

        // --- TV SHOWS ---
        public async Task<List<TmdbContentDto>> SearchTvShowsAsync(string query, string language = "en-US")
        {
            // Endpoint: search/tv
            var response = await _httpClient.GetAsync($"search/tv?api_key={_apiKey}&query={query}&language={language}");
            return await ParseResponseAsync<TmdbContentDto>(response);
        }

        public async Task<List<TmdbContentDto>> GetTrendingTvShowsAsync(string language = "en-US")
        {
            // Endpoint: trending/tv
            var response = await _httpClient.GetAsync($"trending/tv/week?api_key={_apiKey}&language={language}");
            return await ParseResponseAsync<TmdbContentDto>(response);
        }

        public async Task<TmdbShowDetailDto?> GetTvShowDetailsAsync(int tmdbId, string language = "en-US")
        {
            var response = await _httpClient.GetAsync($"tv/{tmdbId}?api_key={_apiKey}&language={language}");
            if (!response.IsSuccessStatusCode) return null;
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TmdbShowDetailDto>(content);
        }

        // --- MOVIES ---
        public async Task<List<TmdbContentDto>> SearchMoviesAsync(string query, string language = "en-US")
        {
            // Endpoint: search/movie
            var response = await _httpClient.GetAsync($"search/movie?api_key={_apiKey}&query={query}&language={language}");
            return await ParseResponseAsync<TmdbContentDto>(response);
        }

        public async Task<List<TmdbContentDto>> GetTrendingMoviesAsync(string language = "en-US")
        {
            // Endpoint: trending/movie
            var response = await _httpClient.GetAsync($"trending/movie/week?api_key={_apiKey}&language={language}");
            return await ParseResponseAsync<TmdbContentDto>(response);
        }
        public async Task<TmdbContentDto?> GetMovieDetailsAsync(int tmdbId, string language = "en-US")
        {
            var response = await _httpClient.GetAsync($"movie/{tmdbId}?api_key={_apiKey}&language={language}");
            if (!response.IsSuccessStatusCode) return null;
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<TmdbContentDto>(content);
        }

        // --- TV SEASON DETAILS ---
        public async Task<TmdbSeasonDetailDto?> GetTvSeasonDetailsAsync(int tmdbId, int seasonNumber, string language = "en-US")
        {
            // TMDB Endpoint: /tv/{id}/season/{season_number}
            var response = await _httpClient.GetAsync($"tv/{tmdbId}/season/{seasonNumber}?api_key={_apiKey}&language={language}");

            if (!response.IsSuccessStatusCode) return null;

            var content = await response.Content.ReadAsStringAsync();

            // Snake Case ayarı burası için de geçerli
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower
            };

            return JsonSerializer.Deserialize<TmdbSeasonDetailDto>(content, options);
        }

        // Helper
        private async Task<List<T>> ParseResponseAsync<T>(HttpResponseMessage response)
        {
            if (!response.IsSuccessStatusCode)
                return new List<T>();

            var content = await response.Content.ReadAsStringAsync();
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var result = JsonSerializer.Deserialize<TmdbResponse<T>>(content, options);
            return result?.Results ?? new List<T>();
        }

    }
}