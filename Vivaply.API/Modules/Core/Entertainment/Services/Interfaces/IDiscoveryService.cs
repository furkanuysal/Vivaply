using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Interfaces
{
    public interface IDiscoveryService
    {
        // TV
        Task<List<TmdbContentDto>> SearchTvAsync(string query, string language);
        Task<List<TmdbContentDto>> GetTrendingTvAsync(string language);

        // Movie
        Task<List<TmdbContentDto>> SearchMovieAsync(string query, string language);
        Task<List<TmdbContentDto>> GetTrendingMovieAsync(string language);

        // Game
        Task<List<GameContentDto>> SearchGameAsync(string query);
        Task<List<GameContentDto>> GetTrendingGameAsync();
    }
}
