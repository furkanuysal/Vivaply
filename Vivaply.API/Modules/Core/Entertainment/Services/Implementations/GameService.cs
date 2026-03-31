using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class GameService(VivaplyDbContext dbContext, IIgdbService igdbService) : IGameService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private readonly IIgdbService _igdbService = igdbService;

        // Detail
        public async Task<GameContentDto?> GetDetailAsync(Guid? userId, int igdbId)
        {
            var game = await _igdbService.GetGameDetailAsync(igdbId);
            if (game == null) return null;

            if (!userId.HasValue)
                return game;

            var userGame = await _dbContext.UserGames
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == igdbId);

            if (userGame == null)
                return game;

            // Sync vote average (metadata)
            if (userGame.Metadata != null && Math.Abs(userGame.Metadata.VoteAverage - game.VoteAverage) > 0.1)
            {
                userGame.Metadata.VoteAverage = game.VoteAverage;
                userGame.Metadata.LastFetchedAt = DateTime.UtcNow;
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

                    // Metadata
                    Title = x.Metadata!.Title,
                    CoverUrl = x.Metadata!.CoverUrl,
                    VoteAverage = x.Metadata!.VoteAverage,
                    ReleaseDate = x.Metadata!.ReleaseDate,
                    Platforms = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.PlatformsJson)),
                    Developers = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.DevelopersJson)),
                    Genres = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.GenresJson)),

                    // User data
                    UserStatus = x.Status,
                    UserRating = x.UserRating,
                    UserPlatform = x.UserPlatform,
                    UserPlaytime = x.UserPlaytime,
                    CompletionType = x.CompletionType
                })
                .ToListAsync();
        }

        public async Task AddToLibraryAsync(Guid userId, TrackGameDto request)
        {
            if (await _dbContext.UserGames.AnyAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId))
                throw new InvalidOperationException("Game already exists in library.");

            await GetOrCreateMetadataAsync(request.IgdbId);

            var game = new UserGame
            {
                UserId = userId,
                IgdbId = request.IgdbId,
                Status = request.Status,
                UserPlatform = request.UserPlatform,
                DateAdded = DateTime.UtcNow,
                DateFinished = request.Status == PlayStatus.Completed ? DateTime.UtcNow : null
            };

            _dbContext.UserGames.Add(game);

            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateStatusAsync(Guid userId, UpdateGameStatusDto request)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId) 
                ?? throw new KeyNotFoundException("Game not found in library.");

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
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId)
                ?? throw new KeyNotFoundException("Game not found in library.");

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
                await GetOrCreateMetadataAsync(request.IgdbId);

                game = new UserGame
                {
                    UserId = userId,
                    IgdbId = request.IgdbId,
                    Status = PlayStatus.Playing,
                    DateAdded = DateTime.UtcNow
                };

                _dbContext.UserGames.Add(game);
            }

            game.UserRating = request.Rating;

            await _dbContext.SaveChangesAsync();
        }

        public async Task AddReviewAsync(Guid userId, AddGameReviewDto request)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId)
                ?? throw new InvalidOperationException("Add game to library before reviewing.");

            game.Review = request.Review;
            await _dbContext.SaveChangesAsync();
        }

        public async Task RemoveAsync(Guid userId, int igdbId)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == igdbId) 
                ?? throw new KeyNotFoundException("Game not found.");

            _dbContext.UserGames.Remove(game);
            await _dbContext.SaveChangesAsync();
        }

        // Private Helper Methods

        private GameMetadata CreateMetadata(int igdbId, GameContentDto details)
        {
            return new GameMetadata
            {
                IgdbId = igdbId,
                Title = details.Title,
                CoverUrl = details.CoverUrl,
                ReleaseDate = details.ReleaseDate,

                PlatformsJson = JsonHelper.Serialize(
                    details.Platforms.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList()
                ),

                DevelopersJson = JsonHelper.Serialize(
                    details.Developers.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList()
                ),

                GenresJson = JsonHelper.Serialize(
                    details.Genres.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(x => x.Trim())
                        .ToList()
                ),

                VoteAverage = details.VoteAverage,
                LastFetchedAt = DateTime.UtcNow
            };
        }

        private async Task<GameMetadata> GetOrCreateMetadataAsync(int igdbId)
        {
            var metadata = await _dbContext.GameMetadata
                .FirstOrDefaultAsync(x => x.IgdbId == igdbId);

            if (metadata != null)
                return metadata;

            var details = await _igdbService.GetGameDetailAsync(igdbId)
                ?? throw new InvalidOperationException("Game details could not be fetched.");

            metadata = CreateMetadata(igdbId, details);

            _dbContext.GameMetadata.Add(metadata);

            try
            {
                await _dbContext.SaveChangesAsync();
                return metadata;
            }
            catch (DbUpdateException)
            {
                return await _dbContext.GameMetadata
                    .FirstAsync(x => x.IgdbId == igdbId);
            }
        }
    }
}
