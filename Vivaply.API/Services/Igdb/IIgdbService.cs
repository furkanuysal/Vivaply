using Vivaply.API.DTOs.Entertainment.Igdb;

namespace Vivaply.API.Services.Igdb
{
    public interface IIgdbService
    {
        Task<List<GameContentDto>> SearchGamesAsync(string query);
        Task<List<GameContentDto>> GetTrendingGamesAsync(); // Popular games
        Task<GameContentDto?> GetGameDetailAsync(int id);
    }
}
