using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Discovery
{
    public class DiscoveryService : IDiscoveryService
    {
        private readonly ITmdbService _tmdbService;

        public DiscoveryService(ITmdbService tmdbService)
        {
            _tmdbService = tmdbService;
        }

        public Task<List<TmdbContentDto>> SearchTvAsync(string query, string language)
            => _tmdbService.SearchTvShowsAsync(query, language);

        public Task<List<TmdbContentDto>> GetTrendingTvAsync(string language)
            => _tmdbService.GetTrendingTvShowsAsync(language);

        public Task<List<TmdbContentDto>> SearchMovieAsync(string query, string language)
            => _tmdbService.SearchMoviesAsync(query, language);

        public Task<List<TmdbContentDto>> GetTrendingMovieAsync(string language)
            => _tmdbService.GetTrendingMoviesAsync(language);
    }

}
