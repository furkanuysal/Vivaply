using Vivaply.API.DTOs.Tmdb;

namespace Vivaply.API.Services
{
    public interface ITmdbService
    {
        // TV Shows
        Task<List<TmdbContentDto>> SearchTvShowsAsync(string query, string language = "en-US");
        Task<List<TmdbContentDto>> GetTrendingTvShowsAsync(string language = "en-US");
        Task<TmdbShowDetailDto?> GetTvShowDetailsAsync(int tmdbId, string language = "en-US");

        // Movies
        Task<List<TmdbContentDto>> SearchMoviesAsync(string query, string language = "en-US");
        Task<List<TmdbContentDto>> GetTrendingMoviesAsync(string language = "en-US");
        Task<TmdbContentDto?> GetMovieDetailsAsync(int tmdbId, string language = "en-US");

        // TV Season Details
        Task<TmdbSeasonDetailDto?> GetTvSeasonDetailsAsync(int tmdbId, int seasonNumber, string language = "en-US");
    }
}