using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class DiscoveryService(ITmdbService tmdbService, IIgdbService igdbService) : IDiscoveryService
    {
        private readonly ITmdbService _tmdbService = tmdbService;
        private readonly IIgdbService _igdbService = igdbService;

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
