using Vivaply.API.DTOs.Entertainment.Igdb;
using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Services.Entertainment.Igdb;
using Vivaply.API.Services.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Discovery
{
    public class DiscoveryService : IDiscoveryService
    {
        private readonly ITmdbService _tmdbService;
        private readonly IIgdbService _igdbService;

        public DiscoveryService(ITmdbService tmdbService, IIgdbService igdbService)
        {
            _tmdbService = tmdbService;
            _igdbService = igdbService;
        }

        public Task<List<TmdbContentDto>> SearchTvAsync(string query, string language)
            => _tmdbService.SearchTvShowsAsync(query, language);

        public Task<List<TmdbContentDto>> GetTrendingTvAsync(string language)
            => _tmdbService.GetTrendingTvShowsAsync(language);

        public Task<List<TmdbContentDto>> SearchMovieAsync(string query, string language)
            => _tmdbService.SearchMoviesAsync(query, language);

        public Task<List<TmdbContentDto>> GetTrendingMovieAsync(string language)
            => _tmdbService.GetTrendingMoviesAsync(language);

        public Task<List<GameContentDto>> SearchGameAsync(string query)
            => _igdbService.SearchGamesAsync(query);

        public Task<List<GameContentDto>> GetTrendingGameAsync()
            => _igdbService.GetTrendingGamesAsync();
    }

}
