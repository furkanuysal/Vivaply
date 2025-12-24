using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Entertainment.Commands.Games;
using Vivaply.API.DTOs.Entertainment.Igdb;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Services.Entertainment.Igdb;

namespace Vivaply.API.Services.Entertainment.Game
{
    public class GameService : IGameService
    {
        private readonly VivaplyDbContext _dbContext;
        private readonly IIgdbService _igdbService;

        public GameService(VivaplyDbContext dbContext, IIgdbService igdbService)
        {
            _dbContext = dbContext;
            _igdbService = igdbService;
        }

        // Detail
        public async Task<GameContentDto?> GetDetailAsync(Guid? userId, int igdbId)
        {
            var game = await _igdbService.GetGameDetailAsync(igdbId);
            if (game == null) return null;

            if (!userId.HasValue)
                return game;

            var userGame = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == igdbId);

            if (userGame == null)
                return game;

            // Sync vote average
            if (Math.Abs(userGame.VoteAverage - game.VoteAverage) > 0.1)
            {
                userGame.VoteAverage = game.VoteAverage;
                await _dbContext.SaveChangesAsync();
            }

            game.UserStatus = userGame.Status;
            game.UserRating = userGame.UserRating;
            game.UserReview = userGame.Review;
            game.UserPlatform = userGame.UserPlatform;
            game.UserPlaytime = userGame.UserPlaytime;
            game.CompletionType = userGame.CompletionType;

            return game;
        }

        // Library
        public async Task<List<GameContentDto>> GetLibraryAsync(Guid userId)
        {
            return await _dbContext.UserGames
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .Select(x => new GameContentDto
                {
                    Id = x.IgdbId,
                    Title = x.Title,
                    CoverUrl = x.CoverUrl,
                    UserStatus = x.Status,
                    VoteAverage = x.VoteAverage,
                    UserRating = x.UserRating,
                    ReleaseDate = x.ReleaseDate,
                    Platforms = x.Platforms ?? "",
                    Developers = x.Developers ?? "",
                    Genres = x.Genres ?? "",
                    UserPlatform = x.UserPlatform,
                    UserPlaytime = x.UserPlaytime,
                    CompletionType = x.CompletionType
                })
                .ToListAsync();
        }

        public async Task AddToLibraryAsync(Guid userId, TrackGameDto request)
        {
            if (await _dbContext.UserGames.AnyAsync(x =>
                x.UserId == userId && x.IgdbId == request.IgdbId))
                throw new InvalidOperationException("Game already exists in library.");

            var details = await _igdbService.GetGameDetailAsync(request.IgdbId);
            if (details == null)
                throw new InvalidOperationException("Game details could not be fetched.");

            var game = new UserGame
            {
                UserId = userId,
                IgdbId = request.IgdbId,
                Title = details.Title,
                CoverUrl = details.CoverUrl,
                ReleaseDate = details.ReleaseDate,
                Status = request.Status,
                VoteAverage = details.VoteAverage,
                Platforms = details.Platforms,
                Developers = details.Developers,
                Genres = details.Genres,
                DateAdded = DateTime.UtcNow,
                UserPlatform = request.UserPlatform,
                DateFinished = request.Status == PlayStatus.Completed ? DateTime.UtcNow : null
            };

            _dbContext.UserGames.Add(game);
            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateStatusAsync(Guid userId, UpdateGameStatusDto request)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null)
                throw new KeyNotFoundException("Game not found in library.");

            game.Status = request.Status;

            if (request.Status == PlayStatus.Completed)
            {
                if (game.DateFinished == null) game.DateFinished = DateTime.UtcNow;
            }
            else
            {
                game.DateFinished = null;
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateProgressAsync(Guid userId, UpdateGameProgressDto request)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null)
                throw new KeyNotFoundException("Game not found in library.");

            game.UserPlaytime = request.UserPlaytime;
            game.CompletionType = request.CompletionType;

            if (!string.IsNullOrWhiteSpace(request.UserPlatform))
                game.UserPlatform = request.UserPlatform;

            if (request.UserRating.HasValue)
                game.UserRating = request.UserRating == 0 ? null : request.UserRating;

            await _dbContext.SaveChangesAsync();
        }

        public async Task RateAsync(Guid userId, RateGameDto request)
        {
            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(nameof(request.Rating));

            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null)
            {
                var details = await _igdbService.GetGameDetailAsync(request.IgdbId);
                if (details == null)
                    throw new InvalidOperationException("Game details could not be fetched.");

                game = new UserGame
                {
                    UserId = userId,
                    IgdbId = request.IgdbId,
                    Title = details.Title,
                    CoverUrl = details.CoverUrl,
                    ReleaseDate = details.ReleaseDate,
                    Platforms = details.Platforms,
                    Developers = details.Developers,
                    Genres = details.Genres,
                    Status = PlayStatus.Playing,
                    VoteAverage = details.VoteAverage
                };

                _dbContext.UserGames.Add(game);
            }

            game.UserRating = request.Rating;
            await _dbContext.SaveChangesAsync();
        }

        public async Task AddReviewAsync(Guid userId, AddGameReviewDto request)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null)
                throw new InvalidOperationException("Add game to library before reviewing.");

            game.Review = request.Review;
            await _dbContext.SaveChangesAsync();
        }

        public async Task RemoveAsync(Guid userId, int igdbId)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == igdbId);

            if (game == null)
                throw new KeyNotFoundException("Game not found.");

            _dbContext.UserGames.Remove(game);
            await _dbContext.SaveChangesAsync();
        }
    }
}
