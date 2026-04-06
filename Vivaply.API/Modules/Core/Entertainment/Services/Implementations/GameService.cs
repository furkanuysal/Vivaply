using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.Events;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class GameService(
        VivaplyDbContext dbContext,
        IIgdbService igdbService,
        IApplicationEventPublisher eventPublisher,
        IActivityCleanupService activityCleanupService,
        IPostCleanupService postCleanupService) : IGameService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private readonly IIgdbService _igdbService = igdbService;
        private readonly IApplicationEventPublisher _eventPublisher = eventPublisher;
        private readonly IActivityCleanupService _activityCleanupService = activityCleanupService;
        private readonly IPostCleanupService _postCleanupService = postCleanupService;

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

        public async Task<List<GameContentDto>> GetLibraryAsync(Guid userId)
        {
            return await _dbContext.UserGames
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .Select(x => new GameContentDto
                {
                    Id = x.IgdbId,
                    Title = x.Metadata!.Title,
                    CoverUrl = x.Metadata!.CoverUrl,
                    VoteAverage = x.Metadata!.VoteAverage,
                    ReleaseDate = x.Metadata!.ReleaseDate,
                    Platforms = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.PlatformsJson)),
                    Developers = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.DevelopersJson)),
                    Genres = string.Join(", ", JsonHelper.DeserializeList<string>(x.Metadata!.GenresJson)),
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

            var metadata = await GetOrCreateMetadataAsync(request.IgdbId);

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

            if (request.Status == PlayStatus.Playing)
            {
                await _eventPublisher.PublishAsync(new GameStartedEvent(
                    userId,
                    request.IgdbId,
                    metadata.Title,
                    metadata.CoverUrl,
                    game.DateAdded,
                    game.Id.ToString()
                ));
            }
            else
            {
                await _eventPublisher.PublishAsync(new LibraryItemAddedEvent(
                    userId,
                    "game",
                    request.IgdbId.ToString(),
                    metadata.Title,
                    metadata.CoverUrl,
                    "UserGame",
                    game.Id.ToString()
                ));
            }
        }

        public async Task UpdateStatusAsync(Guid userId, UpdateGameStatusDto request)
        {
            var game = await _dbContext.UserGames
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId)
                ?? throw new KeyNotFoundException("Game not found in library.");

            var wasCompleted = game.Status == PlayStatus.Completed;
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

            if (!wasCompleted && request.Status == PlayStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new GameCompletedEvent(
                    userId,
                    request.IgdbId,
                    game.Metadata?.Title ?? "Unknown",
                    game.Metadata?.CoverUrl,
                    game.DateFinished ?? DateTime.UtcNow,
                    game.Id.ToString()
                ));
            }
        }

        public async Task UpdateProgressAsync(Guid userId, UpdateGameProgressDto request)
        {
            var game = await _dbContext.UserGames
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId)
                ?? throw new KeyNotFoundException("Game not found in library.");

            game.UserPlaytime = request.UserPlaytime;
            game.CompletionType = request.CompletionType;

            if (!string.IsNullOrWhiteSpace(request.UserPlatform))
                game.UserPlatform = request.UserPlatform;

            if (request.UserRating.HasValue)
                game.UserRating = request.UserRating == 0 ? null : request.UserRating;

            await _dbContext.SaveChangesAsync();

            if (request.UserRating.HasValue && request.UserRating.Value > 0)
            {
                await _eventPublisher.PublishAsync(new GameRatedEvent(
                    userId,
                    request.IgdbId,
                    game.Metadata?.Title ?? "Unknown",
                    game.Metadata?.CoverUrl,
                    request.UserRating.Value,
                    game.Id.ToString(),
                    GetGameDevelopers(game.Metadata),
                    GetGameGenres(game.Metadata)
                ));
            }
        }

        public async Task RateAsync(Guid userId, RateGameDto request)
        {
            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(nameof(request.Rating));

            var game = await _dbContext.UserGames
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null)
            {
                var metadata = await GetOrCreateMetadataAsync(request.IgdbId);

                game = new UserGame
                {
                    UserId = userId,
                    IgdbId = request.IgdbId,
                    Status = PlayStatus.Playing,
                    DateAdded = DateTime.UtcNow,
                    Metadata = metadata
                };

                _dbContext.UserGames.Add(game);
            }

            game.UserRating = request.Rating;

            await _dbContext.SaveChangesAsync();

            await _eventPublisher.PublishAsync(new GameRatedEvent(
                userId,
                request.IgdbId,
                game.Metadata?.Title ?? "Unknown",
                game.Metadata?.CoverUrl,
                request.Rating,
                game.Id.ToString(),
                GetGameDevelopers(game.Metadata),
                GetGameGenres(game.Metadata)
            ));
        }

        public async Task AddReviewAsync(Guid userId, AddGameReviewDto request)
        {
            var game = await _dbContext.UserGames
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId)
                ?? throw new InvalidOperationException("Add game to library before reviewing.");

            game.Review = request.Review;
            await _dbContext.SaveChangesAsync();

            await _eventPublisher.PublishAsync(new GameReviewAddedEvent(
                userId,
                request.IgdbId,
                game.Metadata?.Title ?? "Unknown",
                game.Metadata?.CoverUrl,
                request.Review,
                game.UserRating,
                game.Id.ToString(),
                GetGameDevelopers(game.Metadata),
                GetGameGenres(game.Metadata)
            ));
        }

        public async Task RemoveAsync(Guid userId, int igdbId)
        {
            var game = await _dbContext.UserGames
                .FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == igdbId)
                ?? throw new KeyNotFoundException("Game not found.");

            _dbContext.UserGames.Remove(game);
            await _dbContext.SaveChangesAsync();
            await _activityCleanupService.HideActivitiesForGameAsync(userId, igdbId);
            await _postCleanupService.HidePostsForGameAsync(userId, igdbId);
        }

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

        private static List<string>? GetGameDevelopers(GameMetadata? metadata)
        {
            if (metadata == null)
                return null;

            return NormalizeMetadataList(JsonHelper.DeserializeList<string>(metadata.DevelopersJson), take: 1);
        }

        private static List<string>? GetGameGenres(GameMetadata? metadata)
        {
            if (metadata == null)
                return null;

            return NormalizeMetadataList(JsonHelper.DeserializeList<string>(metadata.GenresJson), take: 2);
        }

        private static List<string>? NormalizeMetadataList(IEnumerable<string>? items, int take)
        {
            var normalized = items?
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Take(take)
                .ToList() ?? [];

            return normalized.Count > 0 ? normalized : null;
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
