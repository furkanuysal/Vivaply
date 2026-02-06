using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Entertainment.Commands.Media;
using Vivaply.API.DTOs.Entertainment.Results.Library;
using Vivaply.API.DTOs.Entertainment.Results.Media;
using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Services.Entertainment.Media.Helpers;
using Vivaply.API.Services.Entertainment.Tmdb;
using Vivaply.API.Services.Infrastructure.RateLimiting;

namespace Vivaply.API.Services.Entertainment.Media
{
    public class MediaService : IMediaService
    {
        private readonly VivaplyDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public MediaService(
            VivaplyDbContext dbContext,
            ITmdbService tmdbService
        )
        {
            _dbContext = dbContext;
            _tmdbService = tmdbService;
        }

        public async Task AddMediaReviewAsync(Guid userId, AddMediaReviewDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (show == null)
                    throw new InvalidOperationException(
                        "You must add the TV show to your library before reviewing it."
                    );

                show.Review = request.Review;
            }
            else // movie
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);

                if (movie == null)
                    throw new InvalidOperationException(
                        "You must add the movie to your library before reviewing it."
                    );

                movie.Review = request.Review;
            }

            await _dbContext.SaveChangesAsync();
        }



        public async Task AddMediaToLibraryAsync(Guid userId, AddMediaToLibraryDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var exists = await _dbContext.UserShows
                    .AnyAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (exists)
                    throw new InvalidOperationException("This TV show is already in your library.");

                var details = await _tmdbService.GetTvShowDetailsAsync(request.TmdbId);
                if (details == null)
                    throw new InvalidOperationException("TV show details could not be fetched.");

                var show = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = request.TmdbId,
                    ShowName = request.Title,
                    PosterPath = request.PosterPath,
                    FirstAirDate = request.Date,
                    Status = request.Status,
                    VoteAverage = details.VoteAverage,
                    ProductionStatus = details.Status,
                    NextAirDate = details.NextEpisodeToAir?.AirDate,
                    LatestEpisodeInfo = details.LastEpisodeToAir != null
                        ? BuildEpisodeInfo(
                            details.LastEpisodeToAir.SeasonNumber,
                            details.LastEpisodeToAir.EpisodeNumber
                        )
                        : null,
                        GenresJson = GenreJsonHelper.Serialize(details.Genres)
                };

                _dbContext.UserShows.Add(show);
            }
            else // movie
            {
                var exists = await _dbContext.UserMovies
                    .AnyAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);

                if (exists)
                    throw new InvalidOperationException("This movie is already in your library.");

                var details = await _tmdbService.GetMovieDetailsAsync(request.TmdbId);
                if (details == null)
                    throw new InvalidOperationException("Movie details could not be fetched.");

                var movie = new UserMovie
                {
                    UserId = userId,
                    TmdbMovieId = request.TmdbId,
                    Title = request.Title,
                    PosterPath = request.PosterPath,
                    ReleaseDate = request.Date,
                    Status = request.Status,
                    VoteAverage = details.VoteAverage,
                    ProductionStatus = details.Status,
                    WatchedAt = request.Status == WatchStatus.Completed ? DateTime.UtcNow : null,
                    GenresJson = GenreJsonHelper.Serialize(details.Genres)
                };

                _dbContext.UserMovies.Add(movie);
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task<int> FixBrokenMediaDataAsync()
        {
            int fixedCount = 0;

            var brokenShows = await _dbContext.UserShows
                .Where(s =>
                    s.ShowName.Contains("Unknown") ||
                    s.VoteAverage == 0 ||
                    s.LatestEpisodeInfo == null ||
                    s.ProductionStatus == null ||
                    s.GenresJson == null)
                .ToListAsync();

            foreach (var show in brokenShows)
            {
                var details = await _tmdbService.GetTvShowDetailsAsync(show.TmdbShowId, "en-US");
                if (details == null) continue;

                show.ShowName = details.Name ?? show.ShowName;
                show.PosterPath = details.PosterPath;
                show.FirstAirDate = details.FirstAirDate;
                show.VoteAverage = details.VoteAverage;
                show.NextAirDate = details.NextEpisodeToAir?.AirDate;
                show.ProductionStatus = details.Status;

                if (details.LastEpisodeToAir != null)
                {
                    show.LatestEpisodeInfo =
                        $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
                }
                if (string.IsNullOrEmpty(show.GenresJson) && details.Genres != null)
                {
                    show.GenresJson = GenreJsonHelper.Serialize(details.Genres);
                }

                fixedCount++;
            }

            var brokenMovies = await _dbContext.UserMovies
                .Where(m =>
                    m.Title.Contains("Unknown") ||
                    m.VoteAverage == 0 ||
                    m.ProductionStatus == null ||
                    m.GenresJson == null)
                .ToListAsync();

            foreach (var movie in brokenMovies)
            {
                var details = await _tmdbService.GetMovieDetailsAsync(movie.TmdbMovieId, "en-US");
                if (details == null) continue;

                movie.Title = details.Title ?? movie.Title;
                movie.PosterPath = details.PosterPath;
                movie.ReleaseDate = details.ReleaseDate;
                movie.VoteAverage = details.VoteAverage;
                movie.ProductionStatus = details.Status;

                if (string.IsNullOrEmpty(movie.GenresJson) && details.Genres != null)
                {
                    movie.GenresJson = GenreJsonHelper.Serialize(details.Genres);
                }

                fixedCount++;
            }

            if (fixedCount > 0)
                await _dbContext.SaveChangesAsync();

            return fixedCount;
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

            if (userId.HasValue)
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbId);

                if (movie != null)
                {
                    result.UserStatus = movie.Status;
                    result.UserRating = movie.UserRating;
                    result.UserReview = movie.Review;
                }
            }

            return result;
        }


        public async Task<TmdbShowDetailDto?> GetTvShowDetailAsync(
             Guid? userId,
             int tmdbId,
             string language
            )
        {
            if (tmdbId <= 0)
                throw new ArgumentException("Invalid tmdbId.", nameof(tmdbId));

            var result = await _tmdbService.GetTvShowDetailsAsync(tmdbId, language);
            if (result == null) return null;

            if (!userId.HasValue)
                return result;

            var userShow = await _dbContext.UserShows
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbId);

            if (userShow == null)
                return result;

            bool hasChanges = false;

            string? freshLatestInfo = null;
            if (result.LastEpisodeToAir != null)
            {
                freshLatestInfo = $"S{result.LastEpisodeToAir.SeasonNumber} E{result.LastEpisodeToAir.EpisodeNumber}";
            }

            if (userShow.LatestEpisodeInfo != freshLatestInfo)
            {
                userShow.LatestEpisodeInfo = freshLatestInfo;
                hasChanges = true;
            }

            if (Math.Abs(userShow.VoteAverage - result.VoteAverage) > 0.1)
            {
                userShow.VoteAverage = result.VoteAverage;
                hasChanges = true;
            }

            if (userShow.NextAirDate != result.NextEpisodeToAir?.AirDate)
            {
                userShow.NextAirDate = result.NextEpisodeToAir?.AirDate;
                hasChanges = true;
            }

            if (userShow.ProductionStatus != result.Status)
            {
                userShow.ProductionStatus = result.Status;
                hasChanges = true;
            }

            if (hasChanges)
                await _dbContext.SaveChangesAsync();

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
            var userShows = await _dbContext.UserShows
                .Where(x => x.UserId == userId)
                .ToListAsync();

            var tvList = userShows.Select(show => new TmdbContentDto
            {
                Id = show.TmdbShowId,
                Name = show.ShowName,
                PosterPath = show.PosterPath,
                UserStatus = show.Status,
                VoteAverage = show.VoteAverage,
                UserRating = show.UserRating,
                FirstAirDate = show.FirstAirDate,
                LatestEpisode = show.LatestEpisodeInfo,
                Status = show.ProductionStatus,
                UserReview = show.Review,
                LastWatchedSeason = show.LastWatchedSeason,
                LastWatchedEpisode = show.LastWatchedEpisode,
                LastWatchedAt = show.LastWatchedAt,
                Genres = GenreJsonHelper.Deserialize(show.GenresJson)
            }).ToList();

            // User movies
            var movieList = await _dbContext.UserMovies
                .Where(x => x.UserId == userId)
                .Select(movie => new TmdbContentDto
                {
                    Id = movie.TmdbMovieId,
                    Title = movie.Title,
                    PosterPath = movie.PosterPath,
                    UserStatus = movie.Status,
                    VoteAverage = movie.VoteAverage,
                    UserRating = movie.UserRating,
                    ReleaseDate = movie.ReleaseDate,
                    Status = movie.ProductionStatus,
                    UserReview = movie.Review,
                    Genres = GenreJsonHelper.Deserialize(movie.GenresJson)
                })
                .ToListAsync();

            return new MediaLibraryDto
            {
                Tv = tvList,
                Movie = movieList
            };
        }


        public async Task<MarkSeasonResultDto> MarkSeasonWatchedAsync(
             Guid userId,
             int tmdbShowId,
             int seasonNumber
            )
        {
            if (tmdbShowId <= 0)
                throw new ArgumentException("Invalid tmdbShowId.", nameof(tmdbShowId));

            if (seasonNumber < 0)
                throw new ArgumentOutOfRangeException(nameof(seasonNumber), "Season number cannot be negative.");

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            // If the show is not in the library, auto-add it (same behavior as controller).
            if (userShow == null)
            {
                var showDetails = await _tmdbService.GetTvShowDetailsAsync(tmdbShowId);

                userShow = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = tmdbShowId,
                    Status = WatchStatus.Watching,
                    ShowName = showDetails?.Name ?? "Unknown",
                    PosterPath = showDetails?.PosterPath,
                    FirstAirDate = showDetails?.FirstAirDate,
                    ProductionStatus = showDetails?.Status
                };

                _dbContext.UserShows.Add(userShow);
                await _dbContext.SaveChangesAsync();
            }

            // Fetch season details from TMDB.
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, seasonNumber);
            if (seasonData == null)
                throw new KeyNotFoundException("Season information could not be found.");

            // Collect already watched episodes for this season.
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
                    WatchedAt = DateTime.UtcNow
                });
            }

            if (episodesToAdd.Count > 0)
            {
                _dbContext.WatchedEpisodes.AddRange(episodesToAdd);

                var lastEpisodeNumber = episodesToAdd.Max(e => e.EpisodeNumber);
                var now = DateTime.UtcNow;

                UpdateLastWatched(userShow, seasonNumber, lastEpisodeNumber, now);

                await _dbContext.SaveChangesAsync();

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
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            ValidateTmdbId(request.TmdbId);

            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(
                    nameof(request.Rating),
                    "Rating must be between 0 and 10."
                );

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await GetOrCreateUserShowAsync(userId, request.TmdbId);
                show.UserRating = request.Rating;
            }
            else // movie
            {
                var movie = await GetOrCreateUserMovieAsync(userId, request.TmdbId);
                movie.UserRating = request.Rating;
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task RemoveMediaFromLibraryAsync(Guid userId, int tmdbId, string type)
        {
            ValidateTmdbId(tmdbId);

            var normalizedType = NormalizeMediaType(type);

            if (normalizedType == "tv")
            {
                var show = await _dbContext.UserShows
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbId);

                if (show == null)
                    throw new KeyNotFoundException("TV show not found in user's library.");

                _dbContext.UserShows.Remove(show);
            }
            else // movie
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbId);

                if (movie == null)
                    throw new KeyNotFoundException("Movie not found in user's library.");

                _dbContext.UserMovies.Remove(movie);
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task<int> SyncMediaLibraryAsync(Guid userId)
        {
            int updatedCount = 0;

            var userShows = await _dbContext.UserShows
                .Where(x => x.UserId == userId)
                .ToListAsync();

            foreach (var show in userShows)
            {
                var details = await _tmdbService.GetTvShowDetailsAsync(show.TmdbShowId, "en-US");
                if (details == null) continue;

                bool hasChanges = false;

                string? freshLatestInfo = null;
                if (details.LastEpisodeToAir != null)
                {
                    freshLatestInfo =
                        $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
                }

                if (show.LatestEpisodeInfo != freshLatestInfo) { show.LatestEpisodeInfo = freshLatestInfo; hasChanges = true; }
                if (show.NextAirDate != details.NextEpisodeToAir?.AirDate) { show.NextAirDate = details.NextEpisodeToAir?.AirDate; hasChanges = true; }
                if (Math.Abs(show.VoteAverage - details.VoteAverage) > 0.1) { show.VoteAverage = details.VoteAverage; hasChanges = true; }
                if (show.ProductionStatus != details.Status) { show.ProductionStatus = details.Status; hasChanges = true; }

                if (hasChanges) updatedCount++;
            }

            var userMovies = await _dbContext.UserMovies
                .Where(x => x.UserId == userId)
                .ToListAsync();

            foreach (var movie in userMovies)
            {
                var details = await _tmdbService.GetMovieDetailsAsync(movie.TmdbMovieId, "en-US");
                if (details == null) continue;

                bool hasChanges = false;

                if (Math.Abs(movie.VoteAverage - details.VoteAverage) > 0.1) { movie.VoteAverage = details.VoteAverage; hasChanges = true; }
                if (movie.ProductionStatus != details.Status) { movie.ProductionStatus = details.Status; hasChanges = true; }

                if (hasChanges) updatedCount++;
            }

            if (updatedCount > 0)
                await _dbContext.SaveChangesAsync();

            return updatedCount;
        }


        public async Task<ToggleEpisodeResultDto> ToggleEpisodeAsync(
            Guid userId,
            int tmdbShowId,
            int seasonNumber,
            int episodeNumber
            )
        {
            if (tmdbShowId <= 0)
                throw new ArgumentException("Invalid tmdbShowId.", nameof(tmdbShowId));

            if (seasonNumber < 0)
                throw new ArgumentOutOfRangeException(nameof(seasonNumber));

            if (episodeNumber <= 0)
                throw new ArgumentOutOfRangeException(nameof(episodeNumber));

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            if (userShow == null)
            {
                var showDetails = await _tmdbService.GetTvShowDetailsAsync(tmdbShowId);

                userShow = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = tmdbShowId,
                    Status = WatchStatus.Watching,
                    ShowName = showDetails?.Name ?? "Unknown",
                    PosterPath = showDetails?.PosterPath,
                    FirstAirDate = showDetails?.FirstAirDate,
                    VoteAverage = showDetails?.VoteAverage ?? 0,
                    NextAirDate = showDetails?.NextEpisodeToAir?.AirDate,
                    ProductionStatus = showDetails?.Status,
                    LatestEpisodeInfo = showDetails?.LastEpisodeToAir != null
                        ? $"S{showDetails.LastEpisodeToAir.SeasonNumber} E{showDetails.LastEpisodeToAir.EpisodeNumber}"
                        : null
                };

                _dbContext.UserShows.Add(userShow);
                await _dbContext.SaveChangesAsync();
            }

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
                    Message = "İşaret kaldırıldı."
                };
            }

            var now = DateTime.UtcNow;

            _dbContext.WatchedEpisodes.Add(new WatchedEpisode
            {
                UserShowId = userShow.Id,
                SeasonNumber = seasonNumber,
                EpisodeNumber = episodeNumber,
                WatchedAt = now
            });

            UpdateLastWatched(userShow, seasonNumber, episodeNumber, now);

            await _dbContext.SaveChangesAsync();

            return new ToggleEpisodeResultDto
            {
                SeasonNumber = seasonNumber,
                EpisodeNumber = episodeNumber,
                IsWatched = true,
                Message = "Bölüm izlendi!"
            };

        }


        public async Task UpdateMediaProgressAsync(Guid userId, UpdateMediaProgressDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.WatchedEpisodes)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (show == null)
                    throw new KeyNotFoundException("TV show not found in user's library.");

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
            }
            else // movie
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);

                if (movie == null)
                    throw new KeyNotFoundException("Movie not found in user's library.");

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
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task UpdateMediaStatusAsync(Guid userId, UpdateMediaStatusDto request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            ValidateTmdbId(request.TmdbId);

            var type = NormalizeMediaType(request.Type);

            if (type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.WatchedEpisodes)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (show == null)
                    throw new KeyNotFoundException("TV show not found in user's library.");

                show.Status = request.Status;

                // If completed, mark all episodes as watched
                if (request.Status == WatchStatus.Completed)
                {
                    await MarkAllEpisodesWatchedAsync(show, request.TmdbId);
                }
            }
            else // movie
            {
                var movie = await _dbContext.UserMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);

                if (movie == null)
                    throw new KeyNotFoundException("Movie not found in user's library.");

                movie.Status = request.Status;

                if (request.Status == WatchStatus.Completed)
                {
                    if (movie.WatchedAt == null) movie.WatchedAt = DateTime.UtcNow;
                }
                else
                {
                    movie.WatchedAt = null;
                }
            }

            await _dbContext.SaveChangesAsync();
        }

        public async Task<WatchNextEpisodeResultDto> WatchNextEpisodeAsync(
             Guid userId,
             int tmdbShowId
        )
        {
            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            if (userShow == null)
                throw new InvalidOperationException("Dizi listenizde değil.");

            var now = DateTime.UtcNow;

            // Find last watched episode
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

            // Try current season
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, targetSeason);

            if (seasonData != null)
            {
                var nextEpisode = seasonData.Episodes
                    .OrderBy(e => e.EpisodeNumber)
                    .FirstOrDefault(e => e.EpisodeNumber > targetEpisode);

                if (nextEpisode != null)
                {
                    _dbContext.WatchedEpisodes.Add(new WatchedEpisode
                    {
                        UserShowId = userShow.Id,
                        SeasonNumber = targetSeason,
                        EpisodeNumber = nextEpisode.EpisodeNumber,
                        WatchedAt = now
                    });

                    UpdateLastWatched(userShow, targetSeason, nextEpisode.EpisodeNumber, now);

                    string currentEpisodeInfo = $"S{targetSeason} E{nextEpisode.EpisodeNumber}";

                    if (userShow.ProductionStatus == "Ended" &&
                        userShow.LatestEpisodeInfo == currentEpisodeInfo)
                    {
                        userShow.Status = WatchStatus.Completed;
                    }

                    await _dbContext.SaveChangesAsync();

                    return new WatchNextEpisodeResultDto
                    {
                        SeasonNumber = targetSeason,
                        EpisodeNumber = nextEpisode.EpisodeNumber,
                        NewStatus = userShow.Status,
                        Message = $"{targetSeason}. Sezon {nextEpisode.EpisodeNumber}. Bölüm izlendi!"
                    };
                }
            }

            // Try next season
            var nextSeasonNumber = targetSeason + 1;
            var nextSeasonData = await _tmdbService.GetTvSeasonDetailsAsync(tmdbShowId, nextSeasonNumber);

            if (nextSeasonData != null && nextSeasonData.Episodes.Any())
            {
                var firstEpisode = nextSeasonData.Episodes
                    .OrderBy(e => e.EpisodeNumber)
                    .First();

                _dbContext.WatchedEpisodes.Add(new WatchedEpisode
                {
                    UserShowId = userShow.Id,
                    SeasonNumber = nextSeasonNumber,
                    EpisodeNumber = firstEpisode.EpisodeNumber,
                    WatchedAt = now
                });

                UpdateLastWatched(userShow, nextSeasonNumber, firstEpisode.EpisodeNumber, now);

                string currentEpisodeInfo = $"S{nextSeasonNumber} E{firstEpisode.EpisodeNumber}";

                if (userShow.ProductionStatus == "Ended" &&
                    userShow.LatestEpisodeInfo == currentEpisodeInfo)
                {
                    userShow.Status = WatchStatus.Completed;
                }

                await _dbContext.SaveChangesAsync();

                return new WatchNextEpisodeResultDto
                {
                    SeasonNumber = nextSeasonNumber,
                    EpisodeNumber = firstEpisode.EpisodeNumber,
                    NewStatus = userShow.Status,
                    Message = $"{nextSeasonNumber}. Sezon {firstEpisode.EpisodeNumber}. Bölüm izlendi!"
                };
            }

            throw new InvalidOperationException(
                "İzlenecek yeni bölüm bulunamadı (Dizi güncel olabilir)."
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
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbShowId);

            if (userShow != null)
                return userShow;

            var details = await _tmdbService.GetTvShowDetailsAsync(tmdbShowId);
            if (details == null)
                throw new InvalidOperationException("TV show details could not be fetched from TMDB.");

            string? latestEpisodeInfo = null;
            if (details.LastEpisodeToAir != null)
            {
                latestEpisodeInfo =
                    $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
            }

            userShow = new UserShow
            {
                UserId = userId,
                TmdbShowId = tmdbShowId,
                ShowName = details.Name ?? "Unknown",
                PosterPath = details.PosterPath,
                FirstAirDate = details.FirstAirDate,
                Status = WatchStatus.Watching,
                VoteAverage = details.VoteAverage,
                LatestEpisodeInfo = latestEpisodeInfo,
                NextAirDate = details.NextEpisodeToAir?.AirDate,
                ProductionStatus = details.Status,
                GenresJson = GenreJsonHelper.Serialize(details.Genres)
            };

            _dbContext.UserShows.Add(userShow);
            return userShow;
        }

        private async Task<UserMovie> GetOrCreateUserMovieAsync(Guid userId, int tmdbMovieId)
        {
            var movie = await _dbContext.UserMovies
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbMovieId);

            if (movie != null)
                return movie;

            var details = await _tmdbService.GetMovieDetailsAsync(tmdbMovieId);
            if (details == null)
                throw new InvalidOperationException("Movie details could not be fetched from TMDB.");

            movie = new UserMovie
            {
                UserId = userId,
                TmdbMovieId = tmdbMovieId,
                Title = details.Title ?? "Unknown",
                PosterPath = details.PosterPath,
                ReleaseDate = details.ReleaseDate,
                Status = WatchStatus.Completed,
                VoteAverage = details.VoteAverage,
                ProductionStatus = details.Status,
                GenresJson = GenreJsonHelper.Serialize(details.Genres)
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

        private void UpdateLastWatched(UserShow show, int season, int episode, DateTime watchedAt)
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

        private void RecalculateLastWatched(UserShow show)
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
    }
}
