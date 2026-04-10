using Microsoft.EntityFrameworkCore;
using System.Globalization;
using Vivaply.API.Data;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Entities.Entertainment.Tmdb;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Media;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Library;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Media;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;
using Vivaply.API.Modules.Core.Ratings.Enums;
using Vivaply.API.Modules.Core.Ratings.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.Events;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class MediaService(
        VivaplyDbContext dbContext,
        ITmdbService tmdbService,
        IApplicationEventPublisher eventPublisher,
        IActivityCleanupService activityCleanupService,
        IPostCleanupService postCleanupService,
        IContentRatingService contentRatingService
        ) : IMediaService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private readonly ITmdbService _tmdbService = tmdbService;
        private readonly IApplicationEventPublisher _eventPublisher = eventPublisher;
        private readonly IActivityCleanupService _activityCleanupService = activityCleanupService;
        private readonly IPostCleanupService _postCleanupService = postCleanupService;
        private readonly IContentRatingService _contentRatingService = contentRatingService;

        public async Task AddMediaReviewAsync(Guid userId, AddMediaReviewDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.Metadata)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId)
                    ?? throw new InvalidOperationException(
                        "You must add the TV show to your library before reviewing it."
                    );

                show.Review = request.Review;

                await _dbContext.SaveChangesAsync();

                await _eventPublisher.PublishAsync(new MediaReviewAddedEvent(
                    userId,
                    "tv_show",
                    request.TmdbId.ToString(),
                    show.Metadata?.Name ?? "Unknown",
                    show.Metadata?.PosterPath,
                    request.Review,
                    show.UserRating,
                    "UserShow",
                    show.Id.ToString(),
                    GetMediaGenres(show.Metadata?.GenresJson)
                ));

                return;
            }
            
            var movie = await _dbContext.UserMovies
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId)
                ?? throw new InvalidOperationException(
                    "You must add the movie to your library before reviewing it."
                );

            movie.Review = request.Review;

            await _dbContext.SaveChangesAsync();

            await _eventPublisher.PublishAsync(new MediaReviewAddedEvent(
                userId,
                "movie",
                request.TmdbId.ToString(),
                movie.Metadata?.Title ?? "Unknown",
                movie.Metadata?.PosterPath,
                request.Review,
                movie.UserRating,
                "UserMovie",
                movie.Id.ToString(),
                GetMediaGenres(movie.Metadata?.GenresJson)
            ));
        }

        public async Task AddMediaToLibraryAsync(Guid userId, AddMediaToLibraryDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var exists = await _dbContext.UserShows
                    .AnyAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (exists)
                    throw new InvalidOperationException("This TV show is already in your library.");

                var metadata = await GetOrCreateShowMetadataAsync(request.TmdbId);

                var show = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = request.TmdbId,
                    Metadata = metadata,
                    Status = request.Status,
                    StartedAt = DateTime.UtcNow,
                    LastWatchedAt = request.Status == WatchStatus.Completed
                        ? DateTime.UtcNow
                        : null
                };

                _dbContext.UserShows.Add(show);

                await _dbContext.SaveChangesAsync();

                await _eventPublisher.PublishAsync(new LibraryItemAddedEvent(
                    userId,
                    "tv_show",
                    request.TmdbId.ToString(),
                    metadata.Name,
                    metadata.PosterPath,
                    "UserShow",
                    show.Id.ToString()
                ));

                return;
            }

            var movieExists = await _dbContext.UserMovies
                .AnyAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);

            if (movieExists)
                throw new InvalidOperationException("This movie is already in your library.");

            var movieMetadata = await GetOrCreateMovieMetadataAsync(request.TmdbId);

            var movie = new UserMovie
            {
                UserId = userId,
                TmdbMovieId = request.TmdbId,
                Metadata = movieMetadata,
                Status = request.Status,
                WatchedAt = request.Status == WatchStatus.Completed
                    ? DateTime.UtcNow
                    : null
            };

            _dbContext.UserMovies.Add(movie);

            await _dbContext.SaveChangesAsync();

            if (request.Status == WatchStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new MovieWatchedEvent(
                    userId,
                    request.TmdbId,
                    movieMetadata.Title,
                    movieMetadata.PosterPath,
                    movie.WatchedAt ?? DateTime.UtcNow,
                    movie.Id.ToString()
                ));
            }
            else
            {
                await _eventPublisher.PublishAsync(new LibraryItemAddedEvent(
                    userId,
                    "movie",
                    request.TmdbId.ToString(),
                    movieMetadata.Title,
                    movieMetadata.PosterPath,
                    "UserMovie",
                    movie.Id.ToString()
                ));
            }
        }

        public async Task<TmdbContentDto?> GetMovieDetailAsync(
         Guid? userId,
         int tmdbId,
         string language
        )
        {
            if (tmdbId <= 0)
                throw new ArgumentException("Invalid tmdbId.", nameof(tmdbId));

            var result = await _tmdbService.GetMovieDetailsAsync(tmdbId, language);
            if (result == null) return null;

            var movieStats = await _contentRatingService.GetStatsAsync(
                ContentSourceType.Movie,
                tmdbId.ToString());
            result.VivaRating = movieStats?.AverageRating;
            result.VivaRatingCount = movieStats?.RatingCount ?? 0;

            if (userId.HasValue)
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbId);

                if (movie != null)
                {
                    result.UserStatus = movie.Status;
                    result.UserRating = movie.UserRating;
                    result.UserReview = movie.Review;
                    result.LastWatchedAt = movie.WatchedAt;
                }
            }

            return result;
        }

        public async Task<TmdbShowDetailDto?> GetTvShowDetailAsync(Guid? userId,int tmdbId,string language)
        {
            if (tmdbId <= 0)
                throw new ArgumentException("Invalid tmdbId.", nameof(tmdbId));

            var result = await _tmdbService.GetTvShowDetailsAsync(tmdbId, language);
            if (result == null) return null;

            var showStats = await _contentRatingService.GetStatsAsync(
                ContentSourceType.TvShow,
                tmdbId.ToString());
            result.VivaRating = showStats?.AverageRating;
            result.VivaRatingCount = showStats?.RatingCount ?? 0;

            if (!userId.HasValue)
                return result;

            var userShow = await _dbContext.UserShows
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbId);

            if (userShow == null)
                return result;

            var metadata = userShow.Metadata;

            bool hasChanges = false;

            if (metadata != null)
            {
                var freshSeason = result.LastEpisodeToAir?.SeasonNumber;
                var freshEpisode = result.LastEpisodeToAir?.EpisodeNumber;

                if (metadata.LastKnownSeason != freshSeason)
                {
                    metadata.LastKnownSeason = freshSeason;
                    hasChanges = true;
                }

                if (metadata.LastKnownEpisode != freshEpisode)
                {
                    metadata.LastKnownEpisode = freshEpisode;
                    hasChanges = true;
                }

                var nextAirDate = ParseTmdbDate(result.NextEpisodeToAir?.AirDate);

                if (metadata.NextEpisodeAirDate != nextAirDate)
                {
                    metadata.NextEpisodeAirDate = nextAirDate;
                    hasChanges = true;
                }

                if (Math.Abs(metadata.VoteAverage - result.VoteAverage) > 0.1)
                {
                    metadata.VoteAverage = result.VoteAverage;
                    hasChanges = true;
                }

                if (metadata.ProductionStatus != result.Status)
                {
                    metadata.ProductionStatus = result.Status;
                    hasChanges = true;
                }

                if (hasChanges)
                {
                    metadata.LastFetchedAt = DateTime.UtcNow;
                    await _dbContext.SaveChangesAsync();
                }
            }

            result.UserStatus = userShow.Status;
            result.UserRating = userShow.UserRating;
            result.UserReview = userShow.Review;

            return result;
        }

        public async Task<TmdbSeasonDetailDto?> GetSeasonDetailAsync(Guid? userId, int tmdbShowId, int seasonNumber, string language)
        {
            // Use shared validation helper
            ValidateTmdbId(tmdbShowId);

            if (seasonNumber < 0)
                throw new ArgumentOutOfRangeException(
                    nameof(seasonNumber),
                    "Season number cannot be negative."
                );

            // Fetch season details from TMDB
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(
                tmdbShowId,
                seasonNumber,
                language
            );

            if (seasonData == null)
                return null;

            // Anonymous user → return raw TMDB data
            if (!userId.HasValue)
                return seasonData;

            // Try to get user show without creating it
            var userShow = await _dbContext.UserShows
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.UserId == userId.Value &&
                    x.TmdbShowId == tmdbShowId
                );

            if (userShow == null)
                return seasonData;

            // Fetch watched episodes for this season
            var watchedEpisodeNumbers = await _dbContext.WatchedEpisodes
                .Where(w =>
                    w.UserShowId == userShow.Id &&
                    w.SeasonNumber == seasonNumber
                )
                .Select(w => w.EpisodeNumber)
                .ToHashSetAsync();

            // Mark watched episodes
            foreach (var episode in seasonData.Episodes)
            {
                episode.IsWatched =
                    watchedEpisodeNumbers.Contains(episode.EpisodeNumber);
            }

            return seasonData;
        }

        public async Task<MediaLibraryDto> GetUserLibraryAsync(Guid userId)
        {
            // User shows
            var userShows = await _dbContext.UserShows.
                Include(x => x.Metadata).
                Where(x => x.UserId == userId).
                ToListAsync();

            var tvList = userShows.Select(show => new TmdbContentDto
            {
                Id = show.TmdbShowId,

                Name = show.Metadata!.Name,
                PosterPath = show.Metadata!.PosterPath,
                VoteAverage = show.Metadata!.VoteAverage,

                FirstAirDate = show.Metadata!.FirstAirDate?.ToString("yyyy-MM-dd"),

                LatestEpisode = show.Metadata!.LastKnownSeason != null && show.Metadata.LastKnownEpisode != null
                    ? $"S{show.Metadata.LastKnownSeason} E{show.Metadata.LastKnownEpisode}"
                    : null,

                Status = show.Metadata!.ProductionStatus,

                Genres = JsonHelper.DeserializeList<TmdbGenreDto>(show.Metadata!.GenresJson),

                UserStatus = show.Status,
                UserRating = show.UserRating,
                UserReview = show.Review,

                LastWatchedSeason = show.LastWatchedSeason,
                LastWatchedEpisode = show.LastWatchedEpisode,
                LastWatchedAt = show.LastWatchedAt

            }).ToList();

            // User movies
            var userMovies = await _dbContext.UserMovies
                .Include(x => x.Metadata)
                .Where(x => x.UserId == userId)
                .ToListAsync();

            var movieList = userMovies.Select(movie => new TmdbContentDto
            {
                Id = movie.TmdbMovieId,

                Title = movie.Metadata!.Title,
                PosterPath = movie.Metadata!.PosterPath,
                VoteAverage = movie.Metadata!.VoteAverage,
                ReleaseDate = movie.Metadata!.ReleaseDate?.ToString("yyyy-MM-dd"),
                Status = movie.Metadata!.ProductionStatus,

                Genres = JsonHelper.DeserializeList<TmdbGenreDto>(movie.Metadata!.GenresJson),

                UserStatus = movie.Status,
                UserRating = movie.UserRating,
                UserReview = movie.Review,
                LastWatchedAt = movie.WatchedAt
            }).ToList();

            return new MediaLibraryDto
            {
                Tv = tvList,
                Movie = movieList
            };
        }
        public async Task<MarkSeasonResultDto> MarkSeasonWatchedAsync(Guid userId, int tmdbShowId, int seasonNumber)
        {
            if (tmdbShowId <= 0)
                throw new ArgumentException("Invalid tmdbShowId.", nameof(tmdbShowId));

            if (seasonNumber < 0)
                throw new ArgumentOutOfRangeException(nameof(seasonNumber), "Season number cannot be negative.");

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            var now = DateTime.UtcNow;

            // Auto-add show if not in library
            if (userShow == null)
            {
                var metadata = await GetOrCreateShowMetadataAsync(tmdbShowId);

                userShow = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = tmdbShowId,
                    Metadata = metadata,
                    Status = WatchStatus.Watching,
                    StartedAt = now
                };

                _dbContext.UserShows.Add(userShow);
                await _dbContext.SaveChangesAsync();
            }

            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, seasonNumber)
                ?? throw new KeyNotFoundException("Season information could not be found.");

            var watchedEpisodeNumbers = userShow.WatchedEpisodes
                .Where(e => e.SeasonNumber == seasonNumber)
                .Select(e => e.EpisodeNumber)
                .ToHashSet();

            var episodesToAdd = new List<WatchedEpisode>();

            foreach (var episode in seasonData.Episodes)
            {
                if (watchedEpisodeNumbers.Contains(episode.EpisodeNumber))
                    continue;

                episodesToAdd.Add(new WatchedEpisode
                {
                    UserShowId = userShow.Id,
                    SeasonNumber = seasonNumber,
                    EpisodeNumber = episode.EpisodeNumber,
                    WatchedAt = now
                });
            }

            if (episodesToAdd.Count > 0)
            {
                _dbContext.WatchedEpisodes.AddRange(episodesToAdd);

                var lastEpisodeNumber = episodesToAdd.Max(e => e.EpisodeNumber);

                UpdateLastWatched(userShow, seasonNumber, lastEpisodeNumber, now);

                await _dbContext.SaveChangesAsync();

                await _eventPublisher.PublishAsync(new SeasonCompletedEvent(
                    userId,
                    tmdbShowId,
                    userShow.Metadata?.Name ?? "Unknown",
                    userShow.Metadata?.PosterPath,
                    seasonNumber,
                    episodesToAdd.Count,
                    now
                ));

                return new MarkSeasonResultDto
                {
                    SeasonNumber = seasonNumber,
                    AddedEpisodeCount = episodesToAdd.Count,
                    Message = $"{episodesToAdd.Count} episode(s) marked as watched."
                };
            }

            return new MarkSeasonResultDto
            {
                SeasonNumber = seasonNumber,
                AddedEpisodeCount = 0,
                Message = "All episodes in this season are already marked as watched."
            };
        }

        public async Task RateMediaAsync(Guid userId, RateMediaDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateTmdbId(request.TmdbId);

            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(
                    nameof(request),
                    request.Rating,
                    "Rating must be between 0 and 10."
                );

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await GetOrCreateUserShowAsync(userId, request.TmdbId);
                show.UserRating = request.Rating;

                await _dbContext.SaveChangesAsync();
                await _contentRatingService.SetRatingAsync(
                    userId,
                    ContentSourceType.TvShow,
                    request.TmdbId.ToString(),
                    request.Rating);

                await _eventPublisher.PublishAsync(new MediaRatedEvent(
                    userId,
                    "tv_show",
                    request.TmdbId.ToString(),
                    show.Metadata?.Name ?? "Unknown",
                    show.Metadata?.PosterPath,
                    request.Rating,
                    "UserShow",
                    show.Id.ToString(),
                    GetMediaGenres(show.Metadata?.GenresJson)
                ));

                return;
            }

            var movie = await GetOrCreateUserMovieAsync(userId, request.TmdbId);
            movie.UserRating = request.Rating;

            await _dbContext.SaveChangesAsync();
            await _contentRatingService.SetRatingAsync(
                userId,
                ContentSourceType.Movie,
                request.TmdbId.ToString(),
                request.Rating);

            await _eventPublisher.PublishAsync(new MediaRatedEvent(
                userId,
                "movie",
                request.TmdbId.ToString(),
                movie.Metadata?.Title ?? "Unknown",
                movie.Metadata?.PosterPath,
                request.Rating,
                "UserMovie",
                movie.Id.ToString(),
                GetMediaGenres(movie.Metadata?.GenresJson)
            ));
        }

        public async Task RemoveMediaFromLibraryAsync(Guid userId, int tmdbId, string type)
        {
            ValidateTmdbId(tmdbId);

            var normalizedType = NormalizeMediaType(type);

            if (normalizedType == "tv")
            {
                var show = await _dbContext.UserShows
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbId)
                ?? throw new KeyNotFoundException("TV show not found in user's library.");

                _dbContext.UserShows.Remove(show);
                await _dbContext.SaveChangesAsync();
                await _activityCleanupService.HideActivitiesForShowAsync(userId, tmdbId);
                await _postCleanupService.HidePostsForShowAsync(userId, tmdbId);
                return;
            }

            var movie = await _dbContext.UserMovies
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbId)
                ?? throw new KeyNotFoundException("Movie not found in user's library.");

            _dbContext.UserMovies.Remove(movie);
            await _dbContext.SaveChangesAsync();
            await _activityCleanupService.HideActivitiesForMovieAsync(userId, tmdbId);
            await _postCleanupService.HidePostsForMovieAsync(userId, tmdbId);
        }

        public async Task<ToggleEpisodeResultDto> ToggleEpisodeAsync(
            Guid userId, 
            int tmdbShowId, 
            int seasonNumber, 
            int episodeNumber)
        {
            if (tmdbShowId <= 0)
                throw new ArgumentException("Invalid tmdbShowId.", nameof(tmdbShowId));

            ArgumentOutOfRangeException.ThrowIfNegative(seasonNumber);
            ArgumentOutOfRangeException.ThrowIfNegativeOrZero(episodeNumber);

            var userShow = await GetOrCreateUserShowAsync(userId, tmdbShowId);

            await _dbContext.Entry(userShow)
                .Collection(x => x.WatchedEpisodes)
                .LoadAsync();

            var existingEpisode = userShow.WatchedEpisodes
                .FirstOrDefault(e => e.SeasonNumber == seasonNumber && e.EpisodeNumber == episodeNumber);

            if (existingEpisode != null)
            {
                _dbContext.WatchedEpisodes.Remove(existingEpisode);
                userShow.WatchedEpisodes.Remove(existingEpisode);

                RecalculateLastWatched(userShow);

                await _dbContext.SaveChangesAsync();

                return new ToggleEpisodeResultDto
                {
                    SeasonNumber = seasonNumber,
                    EpisodeNumber = episodeNumber,
                    IsWatched = false,
                    Message = "The flag has been removed."
                };
            }

            var now = DateTime.UtcNow;

            var watchedEpisode = new WatchedEpisode
            {
                UserShowId = userShow.Id,
                SeasonNumber = seasonNumber,
                EpisodeNumber = episodeNumber,
                WatchedAt = now
            };

            _dbContext.WatchedEpisodes.Add(watchedEpisode);

            UpdateLastWatched(userShow, seasonNumber, episodeNumber, now);

            await _dbContext.SaveChangesAsync();

            await _eventPublisher.PublishAsync(new EpisodeWatchedEvent(
                userId,
                tmdbShowId,
                userShow.Metadata?.Name ?? "Unknown",
                userShow.Metadata?.PosterPath,
                seasonNumber,
                episodeNumber,
                now,
                watchedEpisode.Id.ToString()
            ));

            return new ToggleEpisodeResultDto
            {
                SeasonNumber = seasonNumber,
                EpisodeNumber = episodeNumber,
                IsWatched = true,
                Message = "The episode has been watched!"
            };
        }


        public async Task UpdateMediaProgressAsync(Guid userId, UpdateMediaProgressDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.WatchedEpisodes)
                    .Include(x => x.Metadata)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId)
                    ?? throw new KeyNotFoundException("TV show not found in user's library.");

                var wasCompleted = show.Status == WatchStatus.Completed;

                // Update main status
                show.Status = request.Status;

                // Apply rating logic
                show.UserRating = ApplyRating(show.UserRating, request.Rating);

                // Apply review update
                if (request.Review != null)
                    show.Review = request.Review;

                // If completed, mark all episodes as watched
                if (request.Status == WatchStatus.Completed)
                {
                    await MarkAllEpisodesWatchedAsync(show, request.TmdbId);
                }

                await _dbContext.SaveChangesAsync();
                await _contentRatingService.SetRatingAsync(
                    userId,
                    ContentSourceType.TvShow,
                    request.TmdbId.ToString(),
                    show.UserRating);

                if (request.Rating.HasValue && request.Rating.Value > 0)
                {
                    await _eventPublisher.PublishAsync(new MediaRatedEvent(
                        userId,
                        "tv_show",
                        request.TmdbId.ToString(),
                        show.Metadata?.Name ?? "Unknown",
                        show.Metadata?.PosterPath,
                        request.Rating.Value,
                        "UserShow",
                        show.Id.ToString(),
                        GetMediaGenres(show.Metadata?.GenresJson)
                    ));
                }

                if (!string.IsNullOrWhiteSpace(request.Review))
                {
                    await _eventPublisher.PublishAsync(new MediaReviewAddedEvent(
                        userId,
                        "tv_show",
                        request.TmdbId.ToString(),
                        show.Metadata?.Name ?? "Unknown",
                        show.Metadata?.PosterPath,
                        request.Review,
                        show.UserRating,
                        "UserShow",
                        show.Id.ToString(),
                        GetMediaGenres(show.Metadata?.GenresJson)
                    ));
                }

                if (!wasCompleted && request.Status == WatchStatus.Completed)
                {
                    await _eventPublisher.PublishAsync(new ShowCompletedEvent(
                        userId,
                        request.TmdbId,
                        show.Metadata?.Name ?? "Unknown",
                        show.Metadata?.PosterPath,
                        DateTime.UtcNow
                    ));
                }

                return;
            }

            var movie = await _dbContext.UserMovies
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId)
                ?? throw new KeyNotFoundException("Movie not found in user's library.");

            var movieWasCompleted = movie.Status == WatchStatus.Completed;

            movie.Status = request.Status;

            if (request.Status == WatchStatus.Completed)
            {
                if (movie.WatchedAt == null) movie.WatchedAt = DateTime.UtcNow;
            }
            else
            {
                movie.WatchedAt = null;
            }

            movie.UserRating = ApplyRating(movie.UserRating, request.Rating);

            if (request.Review != null)
                movie.Review = request.Review;

            await _dbContext.SaveChangesAsync();
            await _contentRatingService.SetRatingAsync(
                userId,
                ContentSourceType.Movie,
                request.TmdbId.ToString(),
                movie.UserRating);

            if (request.Rating.HasValue && request.Rating.Value > 0)
            {
                await _eventPublisher.PublishAsync(new MediaRatedEvent(
                    userId,
                    "movie",
                    request.TmdbId.ToString(),
                    movie.Metadata?.Title ?? "Unknown",
                    movie.Metadata?.PosterPath,
                    request.Rating.Value,
                    "UserMovie",
                    movie.Id.ToString(),
                    GetMediaGenres(movie.Metadata?.GenresJson)
                ));
            }

            if (!string.IsNullOrWhiteSpace(request.Review))
            {
                await _eventPublisher.PublishAsync(new MediaReviewAddedEvent(
                    userId,
                    "movie",
                    request.TmdbId.ToString(),
                    movie.Metadata?.Title ?? "Unknown",
                    movie.Metadata?.PosterPath,
                    request.Review,
                    movie.UserRating,
                    "UserMovie",
                    movie.Id.ToString(),
                    GetMediaGenres(movie.Metadata?.GenresJson)
                ));
            }

            if (!movieWasCompleted && request.Status == WatchStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new MovieWatchedEvent(
                    userId,
                    request.TmdbId,
                    movie.Metadata?.Title ?? "Unknown",
                    movie.Metadata?.PosterPath,
                    movie.WatchedAt ?? DateTime.UtcNow,
                    movie.Id.ToString()
                ));
            }
        }

        public async Task UpdateMediaStatusAsync(Guid userId, UpdateMediaStatusDto request)
        {
            ArgumentNullException.ThrowIfNull(request);

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.WatchedEpisodes)
                    .Include(x => x.Metadata)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId)
                    ?? throw new KeyNotFoundException("TV show not found in user's library.");

                var wasCompleted = show.Status == WatchStatus.Completed;
                show.Status = request.Status;

                // If completed, mark all episodes as watched
                if (request.Status == WatchStatus.Completed)
                {
                    await MarkAllEpisodesWatchedAsync(show, request.TmdbId);
                }

                await _dbContext.SaveChangesAsync();

                if (!wasCompleted && request.Status == WatchStatus.Completed)
                {
                    await _eventPublisher.PublishAsync(new ShowCompletedEvent(
                        userId,
                        request.TmdbId,
                        show.Metadata?.Name ?? "Unknown",
                        show.Metadata?.PosterPath,
                        DateTime.UtcNow
                    ));
                }

                return;
            }

            var movie = await _dbContext.UserMovies
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId)
                ?? throw new KeyNotFoundException("Movie not found in user's library.");

            var movieWasCompleted = movie.Status == WatchStatus.Completed;
            movie.Status = request.Status;

            if (request.Status == WatchStatus.Completed)
            {
                if (movie.WatchedAt == null) movie.WatchedAt = DateTime.UtcNow;
            }
            else
            {
                movie.WatchedAt = null;
            }

            await _dbContext.SaveChangesAsync();

            if (!movieWasCompleted && request.Status == WatchStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new MovieWatchedEvent(
                    userId,
                    request.TmdbId,
                    movie.Metadata?.Title ?? "Unknown",
                    movie.Metadata?.PosterPath,
                    movie.WatchedAt ?? DateTime.UtcNow,
                    movie.Id.ToString()
                ));
            }
        }

        public async Task<WatchNextEpisodeResultDto> WatchNextEpisodeAsync(Guid userId, int tmdbShowId)
        {
            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId)
                ?? throw new InvalidOperationException("The content isn't in your library!");

            var metadata = userShow.Metadata;
            var now = DateTime.UtcNow;

            var lastWatched = userShow.WatchedEpisodes
                .OrderByDescending(e => e.SeasonNumber)
                .ThenByDescending(e => e.EpisodeNumber)
                .FirstOrDefault();

            int targetSeason = 1;
            int targetEpisode = 0;

            if (lastWatched != null)
            {
                targetSeason = lastWatched.SeasonNumber;
                targetEpisode = lastWatched.EpisodeNumber;
            }

            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, targetSeason);

            if (seasonData != null)
            {
                var nextEpisode = seasonData.Episodes
                    .OrderBy(e => e.EpisodeNumber)
                    .FirstOrDefault(e => e.EpisodeNumber > targetEpisode);

                if (nextEpisode != null)
                {
                    var watchedEpisode = new WatchedEpisode
                    {
                        UserShowId = userShow.Id,
                        SeasonNumber = targetSeason,
                        EpisodeNumber = nextEpisode.EpisodeNumber,
                        WatchedAt = now
                    };

                    _dbContext.WatchedEpisodes.Add(watchedEpisode);

                    UpdateLastWatched(userShow, targetSeason, nextEpisode.EpisodeNumber, now);

                    if (metadata != null &&
                        metadata.ProductionStatus == "Ended" &&
                        metadata.LastKnownSeason == targetSeason &&
                        metadata.LastKnownEpisode == nextEpisode.EpisodeNumber)
                    {
                        userShow.Status = WatchStatus.Completed;
                    }

                    await _dbContext.SaveChangesAsync();

                    await _eventPublisher.PublishAsync(new EpisodeWatchedEvent(
                        userId,
                        tmdbShowId,
                        metadata?.Name ?? "Unknown",
                        metadata?.PosterPath,
                        targetSeason,
                        nextEpisode.EpisodeNumber,
                        now,
                        watchedEpisode.Id.ToString()
                    ));

                    if (userShow.Status == WatchStatus.Completed)
                    {
                        await _eventPublisher.PublishAsync(new ShowCompletedEvent(
                            userId,
                            tmdbShowId,
                            metadata?.Name ?? "Unknown",
                            metadata?.PosterPath,
                            now
                        ));
                    }

                    return new WatchNextEpisodeResultDto
                    {
                        SeasonNumber = targetSeason,
                        EpisodeNumber = nextEpisode.EpisodeNumber,
                        NewStatus = userShow.Status,
                        Message = $"Season {targetSeason} Episode {nextEpisode.EpisodeNumber} has been watched!"
                    };
                }
            }

            var nextSeasonNumber = targetSeason + 1;
            var nextSeasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, nextSeasonNumber);

            if (nextSeasonData != null && nextSeasonData.Episodes.Count > 0)
            {
                var firstEpisode = nextSeasonData.Episodes
                    .OrderBy(e => e.EpisodeNumber)
                    .First();

                var watchedEpisode = new WatchedEpisode
                {
                    UserShowId = userShow.Id,
                    SeasonNumber = nextSeasonNumber,
                    EpisodeNumber = firstEpisode.EpisodeNumber,
                    WatchedAt = now
                };

                _dbContext.WatchedEpisodes.Add(watchedEpisode);

                UpdateLastWatched(userShow, nextSeasonNumber, firstEpisode.EpisodeNumber, now);

                if (metadata != null &&
                    metadata.ProductionStatus == "Ended" &&
                    metadata.LastKnownSeason == nextSeasonNumber &&
                    metadata.LastKnownEpisode == firstEpisode.EpisodeNumber)
                {
                    userShow.Status = WatchStatus.Completed;
                }

                await _dbContext.SaveChangesAsync();

                await _eventPublisher.PublishAsync(new EpisodeWatchedEvent(
                    userId,
                    tmdbShowId,
                    metadata?.Name ?? "Unknown",
                    metadata?.PosterPath,
                    nextSeasonNumber,
                    firstEpisode.EpisodeNumber,
                    now,
                    watchedEpisode.Id.ToString()
                ));

                if (userShow.Status == WatchStatus.Completed)
                {
                    await _eventPublisher.PublishAsync(new ShowCompletedEvent(
                        userId,
                        tmdbShowId,
                        metadata?.Name ?? "Unknown",
                        metadata?.PosterPath,
                        now
                    ));
                }

                return new WatchNextEpisodeResultDto
                {
                    SeasonNumber = nextSeasonNumber,
                    EpisodeNumber = firstEpisode.EpisodeNumber,
                    NewStatus = userShow.Status,
                    Message = $"Season {nextSeasonNumber} Episode {firstEpisode.EpisodeNumber} has been watched!"
                };
            }

            throw new InvalidOperationException(
                "Couldn't find a new episode to watch. (It could be up to date)."
            );
        }

        // --- Private Helpers ---

        private static string NormalizeMediaType(string type)
        {
            if (string.IsNullOrWhiteSpace(type))
                throw new ArgumentException(
                    "Type is required. Expected 'tv' or 'movie'.",
                    nameof(type)
                );

            var normalized = type.Trim().ToLowerInvariant();

            if (normalized != "tv" && normalized != "movie")
                throw new ArgumentException(
                    "Invalid type. Expected 'tv' or 'movie'.",
                    nameof(type)
                );

            return normalized;
        }

        private async Task<UserShow> GetOrCreateUserShowAsync(Guid userId, int tmdbShowId)
        {
            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            if (userShow != null)
                return userShow;

            var metadata = await GetOrCreateShowMetadataAsync(tmdbShowId);

            userShow = new UserShow
            {
                UserId = userId,
                TmdbShowId = tmdbShowId,
                Metadata = metadata,
                Status = WatchStatus.Watching,
                StartedAt = DateTime.UtcNow
            };

            _dbContext.UserShows.Add(userShow);

            return userShow;
        }

        private async Task<UserMovie> GetOrCreateUserMovieAsync(Guid userId, int tmdbMovieId)
        {
            var movie = await _dbContext.UserMovies
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbMovieId);

            if (movie != null)
                return movie;

            var metadata = await GetOrCreateMovieMetadataAsync(tmdbMovieId);

            movie = new UserMovie
            {
                UserId = userId,
                TmdbMovieId = tmdbMovieId,
                Metadata = metadata,
                Status = WatchStatus.Completed,
                WatchedAt = DateTime.UtcNow
            };

            _dbContext.UserMovies.Add(movie);

            return movie;
        }

        private static void ValidateRating(double rating)
        {
            if (rating < 0 || rating > 10)
                throw new ArgumentOutOfRangeException(nameof(rating), "Rating must be between 0 and 10.");
        }

        private static double? ApplyRating(double? currentRating, double? newRating)
        {
            if (!newRating.HasValue)
                return currentRating;

            if (newRating.Value == 0)
                return null;

            ValidateRating(newRating.Value);
            return newRating.Value;
        }


        private async Task MarkAllEpisodesWatchedAsync(UserShow show, int tmdbShowId)
        {
            var showDetails = await _tmdbService.GetTvShowDetailsAsync(tmdbShowId);
            if (showDetails == null) return;

            var existingEpisodeKeys = new HashSet<string>(
                show.WatchedEpisodes.Select(e => $"{e.SeasonNumber}-{e.EpisodeNumber}")
            );

            var episodesToAdd = new List<WatchedEpisode>();
            var today = DateTime.UtcNow.Date;

            foreach (var season in showDetails.Seasons)
            {
                // Skip specials
                if (season.SeasonNumber == 0)
                    continue;

                var seasonDetail = await _tmdbService.GetTvSeasonDetailsAsync(
                    tmdbShowId,
                    season.SeasonNumber
                );

                if (seasonDetail == null)
                    continue;

                foreach (var episode in seasonDetail.Episodes)
                {
                    if (string.IsNullOrWhiteSpace(episode.AirDate))
                        continue;

                    if (!DateTime.TryParse(episode.AirDate, out var airDate))
                        continue;

                    if (airDate.Date > today)
                        continue;

                    var key = $"{season.SeasonNumber}-{episode.EpisodeNumber}";
                    if (existingEpisodeKeys.Contains(key))
                        continue;

                    episodesToAdd.Add(new WatchedEpisode
                    {
                        UserShowId = show.Id,
                        SeasonNumber = season.SeasonNumber,
                        EpisodeNumber = episode.EpisodeNumber,
                        WatchedAt = DateTime.UtcNow
                    });

                    existingEpisodeKeys.Add(key);
                }
            }

            if (episodesToAdd.Count > 0)
            {
                _dbContext.WatchedEpisodes.AddRange(episodesToAdd);

                var last = episodesToAdd
                    .OrderByDescending(e => e.SeasonNumber)
                    .ThenByDescending(e => e.EpisodeNumber)
                    .First();

                UpdateLastWatched(show, last.SeasonNumber, last.EpisodeNumber, DateTime.UtcNow);
            }
        }


        private static string? BuildEpisodeInfo(int seasonNumber, int episodeNumber)
        {
            if (seasonNumber <= 0 || episodeNumber <= 0)
                return null;

            return $"S{seasonNumber} E{episodeNumber}";
        }

        private static void ValidateTmdbId(int tmdbId)
        {
            if (tmdbId <= 0)
                throw new ArgumentException("Invalid tmdbId.", nameof(tmdbId));
        }

        private static void UpdateLastWatched(UserShow show, int season, int episode, DateTime watchedAt)
        {
            if (
                show.LastWatchedSeason == null ||
                season > show.LastWatchedSeason ||
                (season == show.LastWatchedSeason && episode > show.LastWatchedEpisode)
            )
            {
                show.LastWatchedSeason = season;
                show.LastWatchedEpisode = episode;
                show.LastWatchedAt = watchedAt; // metadata only
            }
        }

        private static void RecalculateLastWatched(UserShow show)
        {
            var last = show.WatchedEpisodes
                .OrderByDescending(e => e.SeasonNumber)
                .ThenByDescending(e => e.EpisodeNumber)
                .FirstOrDefault();

            if (last == null)
            {
                show.LastWatchedAt = null;
                show.LastWatchedSeason = null;
                show.LastWatchedEpisode = null;
                return;
            }

            show.LastWatchedSeason = last.SeasonNumber;
            show.LastWatchedEpisode = last.EpisodeNumber;

            // Optional: Only for UI / analytics
            show.LastWatchedAt = last.WatchedAt;
        }

        // Ensure we have metadata for a show, either by fetching existing or creating new.
        private async Task<ShowMetadata> GetOrCreateShowMetadataAsync(int tmdbId)
        {
            var metadata = await _dbContext.ShowMetadata
                .FirstOrDefaultAsync(x => x.TmdbShowId == tmdbId);

            if (metadata != null)
                return metadata;

            var details = await _tmdbService.GetTvShowDetailsAsync(tmdbId)
                ?? throw new InvalidOperationException("TV show details could not be fetched.");

            metadata = new ShowMetadata
            {
                TmdbShowId = tmdbId,
                Name = details.Name ?? "Unknown",
                PosterPath = details.PosterPath,
                FirstAirDate = ParseTmdbDate(details.FirstAirDate),
                VoteAverage = details.VoteAverage,
                ProductionStatus = details.Status,
                LastKnownSeason = details.LastEpisodeToAir?.SeasonNumber,
                LastKnownEpisode = details.LastEpisodeToAir?.EpisodeNumber,
                NextEpisodeAirDate = ParseTmdbDate(details.NextEpisodeToAir?.AirDate),
                GenresJson = JsonHelper.Serialize(details.Genres),
                LastFetchedAt = DateTime.UtcNow
            };

            _dbContext.ShowMetadata.Add(metadata);

            try
            {
                await _dbContext.SaveChangesAsync();
                return metadata;
            }
            catch (DbUpdateException)
            {
                return await _dbContext.ShowMetadata
                    .FirstAsync(x => x.TmdbShowId == tmdbId);
            }
        }

        // Ensure we have metadata for a movie, either by fetching existing or creating new.
        private async Task<MovieMetadata> GetOrCreateMovieMetadataAsync(int tmdbId)
        {
            var metadata = await _dbContext.MovieMetadata
                .FirstOrDefaultAsync(x => x.TmdbMovieId == tmdbId);

            if (metadata != null)
                return metadata;

            var details = await _tmdbService.GetMovieDetailsAsync(tmdbId)
                ?? throw new InvalidOperationException("Movie details could not be fetched.");

            metadata = new MovieMetadata
            {
                TmdbMovieId = tmdbId,
                Title = details.Title ?? "Unknown",
                PosterPath = details.PosterPath,
                ReleaseDate = ParseTmdbDate(details.ReleaseDate),
                VoteAverage = details.VoteAverage,
                ProductionStatus = details.Status,
                GenresJson = JsonHelper.Serialize(details.Genres ?? []),
                LastFetchedAt = DateTime.UtcNow
            };

            _dbContext.MovieMetadata.Add(metadata);

            try
            {
                await _dbContext.SaveChangesAsync();
                return metadata;
            }
            catch (DbUpdateException)
            {
                return await _dbContext.MovieMetadata
                    .FirstAsync(x => x.TmdbMovieId == tmdbId);
            }
        }

        private static DateTime? ParseTmdbDate(string? date)
        {
            if (string.IsNullOrWhiteSpace(date))
                return null;

            if (!DateTime.TryParse(date, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var parsed))
                return null;

            return parsed.ToUniversalTime();
        }

        private static List<string>? GetMediaGenres(string? genresJson)
        {
            var genres = JsonHelper.DeserializeList<TmdbGenreDto>(genresJson)?
                .Where(x => !string.IsNullOrWhiteSpace(x.Name))
                .Select(x => x.Name.Trim())
                .Take(2)
                .ToList() ?? [];

            return genres.Count > 0 ? genres : null;
        }
    }
}
