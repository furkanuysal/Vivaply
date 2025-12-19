using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Discovery
{
    public interface IDiscoveryService
    {
        // TV
        Task<List<TmdbContentDto>> SearchTvAsync(string query, string language);
        Task<List<TmdbContentDto>> GetTrendingTvAsync(string language);

        // Movie
        Task<List<TmdbContentDto>> SearchMovieAsync(string query, string language);
        Task<List<TmdbContentDto>> GetTrendingMovieAsync(string language);
    }
}
