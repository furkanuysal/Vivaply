using Vivaply.API.DTOs.Entertainment.Commands.Games;
using Vivaply.API.DTOs.Entertainment.Igdb;

namespace Vivaply.API.Services.Entertainment.Game
{
    public interface IGameService
    {
        // Detail
        Task<GameContentDto?> GetDetailAsync(Guid? userId, int igdbId);

        // Library
        Task<List<GameContentDto>> GetLibraryAsync(Guid userId);

        Task AddToLibraryAsync(Guid userId, TrackGameDto request);
        Task UpdateStatusAsync(Guid userId, UpdateGameStatusDto request);
        Task UpdateProgressAsync(Guid userId, UpdateGameProgressDto request);
        Task RateAsync(Guid userId, RateGameDto request);
        Task AddReviewAsync(Guid userId, AddGameReviewDto request);
        Task RemoveAsync(Guid userId, int igdbId);
    }
}
