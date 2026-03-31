using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Interfaces
{
    public interface IIgdbService
    {
        Task<List<GameContentDto>> SearchGamesAsync(string query);
        Task<List<GameContentDto>> GetTrendingGamesAsync(); // Popular games
        Task<GameContentDto?> GetGameDetailAsync(int id);
    }
}
