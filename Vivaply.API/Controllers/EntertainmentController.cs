using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vivaply.API.Data;
using Vivaply.API.DTOs;
using Vivaply.API.DTOs.Tmdb;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Services;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EntertainmentController : ControllerBase
    {
        private readonly ITmdbService _tmdbService;
        private readonly VivaplyDbContext _dbContext;

        public EntertainmentController(ITmdbService tmdbService, VivaplyDbContext dbContext)
        {
            _tmdbService = tmdbService;
            _dbContext = dbContext;
        }

        // Getting TMDB Data Endpoints

        [HttpGet("tv/search")]
        public async Task<IActionResult> SearchTv([FromQuery] string query, [FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.SearchTvShowsAsync(query, language);
            return Ok(results);
        }

        [HttpGet("tv/trending")]
        public async Task<IActionResult> GetTrendingTv([FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.GetTrendingTvShowsAsync(language);
            return Ok(results);
        }

        // Getting TMDB TV Show Details
        [HttpGet("tv/{id}")]
        public async Task<IActionResult> GetTvDetail(int id, [FromQuery] string language = "en-US")
        {
            var result = await _tmdbService.GetTvShowDetailsAsync(id, language);
            if (result == null) return NotFound("Dizi bulunamadı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out var userId))
            {
                var userShow = await _dbContext.UserShows.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == id);

                if (userShow != null)
                {
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

                    if (hasChanges) await _dbContext.SaveChangesAsync();

                    result.UserStatus = userShow.Status;
                    result.UserRating = userShow.UserRating;
                    result.UserReview = userShow.Review;
                }
            }
            return Ok(result);
        }

        // Getting TMDB TV Season Details
        [HttpGet("tv/{id}/season/{seasonNumber}")]
        public async Task<IActionResult> GetSeasonDetail(int id, int seasonNumber, [FromQuery] string language = "en-US")
        {
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(id, seasonNumber, language);
            if (seasonData == null) return NotFound("Sezon bulunamadı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out var userId))
            {
                var watchedEpisodes = await _dbContext.WatchedEpisodes
                    .Where(w => w.UserShow!.UserId == userId && w.UserShow.TmdbShowId == id && w.SeasonNumber == seasonNumber)
                    .Select(w => w.EpisodeNumber)
                    .ToListAsync();

                foreach (var episode in seasonData.Episodes)
                {
                    if (watchedEpisodes.Contains(episode.EpisodeNumber)) episode.IsWatched = true;
                }
            }
            return Ok(seasonData);
        }

        // Getting TMDB Movie Search Results
        [HttpGet("movie/search")]
        public async Task<IActionResult> SearchMovie([FromQuery] string query, [FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.SearchMoviesAsync(query, language);
            return Ok(results);
        }

        // Getting TMDB Trending Movies
        [HttpGet("movie/trending")]
        public async Task<IActionResult> GetTrendingMovie([FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.GetTrendingMoviesAsync(language);
            return Ok(results);
        }

        // Getting TMDB Movie Details
        [HttpGet("movie/{id}")]
        public async Task<IActionResult> GetMovieDetail(int id, [FromQuery] string language = "en-US")
        {
            var result = await _tmdbService.GetMovieDetailsAsync(id, language);
            if (result == null) return NotFound("Film bulunamadı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out var userId))
            {
                var userMovie = await _dbContext.UserMovies.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == id);
                if (userMovie != null)
                {
                    result.UserStatus = userMovie.Status;
                    result.UserRating = userMovie.UserRating;
                    result.UserReview = userMovie.Review;
                }
            }
            return Ok(result);
        }

        // Getting User Library
        [HttpGet("library")]
        public async Task<IActionResult> GetLibrary()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            // Get User Shows
            var userShows = await _dbContext.UserShows
                .Where(x => x.UserId == userId)
                .ToListAsync();

            // Get All Watched Episodes
            var allWatchedEpisodes = await _dbContext.WatchedEpisodes
                .Where(w => w.UserShow!.UserId == userId)
                .Select(w => new { w.UserShowId, w.SeasonNumber, w.EpisodeNumber })
                .ToListAsync();

            // Map User Shows to DTOs
            var showDtos = userShows.Select(show =>
            {
                var lastWatched = allWatchedEpisodes
                    .Where(w => w.UserShowId == show.Id)
                    .OrderByDescending(w => w.SeasonNumber)
                    .ThenByDescending(w => w.EpisodeNumber)
                    .FirstOrDefault();

                return new TmdbContentDto
                {
                    Id = show.TmdbShowId,
                    Name = show.ShowName,
                    PosterPath = show.PosterPath,
                    UserStatus = show.Status,
                    VoteAverage = show.VoteAverage,
                    UserRating = show.UserRating ?? 0,
                    FirstAirDate = show.FirstAirDate,
                    LatestEpisode = show.LatestEpisodeInfo,
                    LastWatched = lastWatched != null ? $"S{lastWatched.SeasonNumber} E{lastWatched.EpisodeNumber}" : null, // Format as "S1 E1"
                    Status = show.ProductionStatus
                };
            }).ToList();

            // Get User Movies
            var movies = await _dbContext.UserMovies
                .Where(x => x.UserId == userId)
                .Select(x => new TmdbContentDto
                {
                    Id = x.TmdbMovieId,
                    Title = x.Title,
                    PosterPath = x.PosterPath,
                    UserStatus = x.Status,
                    VoteAverage = x.VoteAverage,
                    UserRating = x.UserRating ?? 0,
                    ReleaseDate = x.ReleaseDate
                }).ToListAsync();

            return Ok(new { tv = showDtos, movie = movies });
        }

        // Entertainment Library Management Endpoints

        // Track an item to library
        [HttpPost("track")]
        public async Task<IActionResult> TrackItem([FromBody] AddToLibraryDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            if (request.Type == "tv")
            {
                // Check if the show is already in the library
                var exists = await _dbContext.UserShows.AnyAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);
                if (exists) return BadRequest("Bu dizi zaten takip ediyorsunuz.");

                var details = await _tmdbService.GetTvShowDetailsAsync(request.TmdbId);

                string? latestInfo = null;
                if (details?.LastEpisodeToAir != null)
                {
                    latestInfo = $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
                }

                var show = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = request.TmdbId,
                    ShowName = request.Title,
                    PosterPath = request.PosterPath,
                    FirstAirDate = request.Date,
                    Status = request.Status,
                    VoteAverage = details?.VoteAverage ?? 0,
                    LatestEpisodeInfo = latestInfo,
                    NextAirDate = details?.NextEpisodeToAir?.AirDate,
                    ProductionStatus = details?.Status
                };
                // Add the show to the library
                _dbContext.UserShows.Add(show);
            }
            else // Movie
            {
                // Check if the movie is already in the library
                var exists = await _dbContext.UserMovies.AnyAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);
                if (exists) return BadRequest("Bu film zaten listenizde.");

                var details = await _tmdbService.GetMovieDetailsAsync(request.TmdbId);

                var movie = new UserMovie
                {
                    UserId = userId,
                    TmdbMovieId = request.TmdbId,
                    Title = request.Title,
                    PosterPath = request.PosterPath,
                    ReleaseDate = request.Date,
                    Status = request.Status,
                    VoteAverage = details?.VoteAverage ?? 0
                };
                // Add the movie to the library
                _dbContext.UserMovies.Add(movie);
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Kütüphaneye eklendi!" });
        }

        // Update an item's watch status (Watched, To Watch, etc.)
        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateStatusDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            if (request.Type == "tv")
            {
                var show = await _dbContext.UserShows
                    .Include(x => x.WatchedEpisodes)
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);

                if (show == null) return NotFound("Dizi listenizde bulunamadı.");

                // Update the show's watch status
                show.Status = request.Status;

                // If the show's status is set to 'completed', add all episodes to the watched list
                if (request.Status == WatchStatus.Completed)
                {
                    var showDetails = await _tmdbService.GetTvShowDetailsAsync(request.TmdbId);
                    if (showDetails != null)
                    {
                        var episodesToAdd = new List<WatchedEpisode>();
                        var existingEpisodeKeys = new HashSet<string>(show.WatchedEpisodes.Select(e => $"{e.SeasonNumber}-{e.EpisodeNumber}"));

                        foreach (var season in showDetails.Seasons)
                        {
                            if (season.SeasonNumber == 0) continue;

                            var seasonDetail = await _tmdbService.GetTvSeasonDetailsAsync(request.TmdbId, season.SeasonNumber);
                            if (seasonDetail != null)
                            {
                                foreach (var episode in seasonDetail.Episodes)
                                {
                                    if (!existingEpisodeKeys.Contains($"{season.SeasonNumber}-{episode.EpisodeNumber}"))
                                    {
                                        episodesToAdd.Add(new WatchedEpisode
                                        {
                                            UserShowId = show.Id,
                                            SeasonNumber = season.SeasonNumber,
                                            EpisodeNumber = episode.EpisodeNumber,
                                            WatchedAt = DateTime.UtcNow
                                        });
                                    }
                                }
                            }
                        }
                        if (episodesToAdd.Count > 0) _dbContext.WatchedEpisodes.AddRange(episodesToAdd);
                    }
                }
            }
            else // Movie
            {
                // Update the movie's watch status
                var movie = await _dbContext.UserMovies.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);
                if (movie == null) return NotFound("Film listenizde bulunamadı.");
                movie.Status = request.Status;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Durum güncellendi!" });
        }

        // Toggle an episode's watch status
        [HttpPost("episode/toggle")]
        public async Task<IActionResult> ToggleEpisode([FromBody] ToggleEpisodeDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbShowId);

            if (userShow == null)
            {
                // If the show is not in the library, add it
                var showDetails = await _tmdbService.GetTvShowDetailsAsync(request.TmdbShowId);
                userShow = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = request.TmdbShowId,
                    Status = WatchStatus.Watching,
                    ShowName = showDetails?.Name ?? "Unknown",
                    PosterPath = showDetails?.PosterPath,
                    FirstAirDate = showDetails?.FirstAirDate,
                    VoteAverage = showDetails?.VoteAverage ?? 0,
                    NextAirDate = showDetails?.NextEpisodeToAir?.AirDate,
                    ProductionStatus = showDetails?.Status
                };

                // If the show has a last episode, set the latest episode info
                if (showDetails?.LastEpisodeToAir != null)
                {
                    userShow.LatestEpisodeInfo = $"S{showDetails.LastEpisodeToAir.SeasonNumber} E{showDetails.LastEpisodeToAir.EpisodeNumber}";
                }

                // Add the show to the library
                _dbContext.UserShows.Add(userShow);
                await _dbContext.SaveChangesAsync();
            }

            // Get the episode from the show
            var existingEpisode = userShow.WatchedEpisodes
                .FirstOrDefault(e => e.SeasonNumber == request.SeasonNumber && e.EpisodeNumber == request.EpisodeNumber);

            // If the episode is already watched, remove it from the watched list
            if (existingEpisode != null)
            {
                // Remove the episode from the watched list
                _dbContext.WatchedEpisodes.Remove(existingEpisode);
                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "İşaret kaldırıldı.", isWatched = false });
            }
            else
            {
                // Add the episode to the watched list
                var newEpisode = new WatchedEpisode
                {
                    UserShowId = userShow.Id,
                    SeasonNumber = request.SeasonNumber,
                    EpisodeNumber = request.EpisodeNumber,
                    WatchedAt = DateTime.UtcNow
                };

                // Add the episode to the watched list
                _dbContext.WatchedEpisodes.Add(newEpisode);
                await _dbContext.SaveChangesAsync();
                return Ok(new { message = "Bölüm izlendi!", isWatched = true });
            }
        }

        // Mark a season as watched
        [HttpPost("episode/mark-season")]
        public async Task<IActionResult> MarkSeasonWatched([FromBody] MarkSeasonWatchedDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbShowId);

            // If the show is not in the library, add it
            if (userShow == null)
            {
                var showDetails = await _tmdbService.GetTvShowDetailsAsync(request.TmdbShowId);
                userShow = new UserShow
                {
                    UserId = userId,
                    TmdbShowId = request.TmdbShowId,
                    Status = WatchStatus.Watching,
                    ShowName = showDetails?.Name ?? "Unknown",
                    PosterPath = showDetails?.PosterPath,
                    FirstAirDate = showDetails?.FirstAirDate,
                    ProductionStatus = showDetails?.Status
                };
                _dbContext.UserShows.Add(userShow);
                await _dbContext.SaveChangesAsync();
            }

            // Get the season data
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(request.TmdbShowId, request.SeasonNumber);
            if (seasonData == null) return NotFound("Sezon bilgisi bulunamadı.");

            // Get the list of watched episode numbers
            var watchedEpisodeNumbers = userShow.WatchedEpisodes
                .Where(e => e.SeasonNumber == request.SeasonNumber)
                .Select(e => e.EpisodeNumber)
                .ToList();

            // Get the list of episodes to add
            var episodesToAdd = new List<WatchedEpisode>();

            foreach (var episode in seasonData.Episodes)
            {
                if (!watchedEpisodeNumbers.Contains(episode.EpisodeNumber))
                {
                    episodesToAdd.Add(new WatchedEpisode
                    {
                        UserShowId = userShow.Id,
                        SeasonNumber = request.SeasonNumber,
                        EpisodeNumber = episode.EpisodeNumber,
                        WatchedAt = DateTime.UtcNow
                    });
                }
            }

            // Add the episodes to the watched list
            if (episodesToAdd.Count > 0)
            {
                _dbContext.WatchedEpisodes.AddRange(episodesToAdd);
                await _dbContext.SaveChangesAsync();
                return Ok(new { message = $"{episodesToAdd.Count} bölüm işaretlendi!", addedCount = episodesToAdd.Count });
            }

            return Ok(new { message = "Bu sezondaki tüm bölümler zaten izlenmiş." });
        }

        // Watch the next episode
        [HttpPost("episode/watch-next")]
        public async Task<IActionResult> WatchNextEpisode([FromBody] WatchNextDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var userShow = await _dbContext.UserShows
                .Include(x => x.WatchedEpisodes)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbShowId);

            if (userShow == null) return NotFound("Dizi listenizde değil.");

            // Find last watched episode
            var lastWatched = userShow.WatchedEpisodes
                .OrderByDescending(e => e.SeasonNumber)
                .ThenByDescending(e => e.EpisodeNumber)
                .FirstOrDefault();

            // If no last watched episode, start from season 1
            int targetSeason = 1;
            int targetEpisode = 0;

            // If there is a last watched episode, find the next episode
            if (lastWatched != null)
            {
                targetSeason = lastWatched.SeasonNumber;
                targetEpisode = lastWatched.EpisodeNumber;
            }

            // Try to find next episode in the current season
            var seasonData = await _tmdbService.GetTvSeasonDetailsAsync(request.TmdbShowId, targetSeason);
            
            // If season data exists, look for the next episode
            if (seasonData != null)
            {
                var nextEpisode = seasonData.Episodes
                    .OrderBy(e => e.EpisodeNumber)
                    .FirstOrDefault(e => e.EpisodeNumber > targetEpisode);

                // If next episode is found in the current season
                if (nextEpisode != null)
                {
                    // Found in current season
                    _dbContext.WatchedEpisodes.Add(new WatchedEpisode
                    {
                        UserShowId = userShow.Id,
                        SeasonNumber = targetSeason,
                        EpisodeNumber = nextEpisode.EpisodeNumber,
                        WatchedAt = DateTime.UtcNow
                    });

                    // Check if this was the absolute last episode
                    string currentEpisodeInfo = $"S{targetSeason} E{nextEpisode.EpisodeNumber}";
                    
                    // If the show is completed, update the status
                    if (userShow.ProductionStatus == "Ended" && userShow.LatestEpisodeInfo == currentEpisodeInfo)
                    {
                        userShow.Status = WatchStatus.Completed;
                    }

                    await _dbContext.SaveChangesAsync();
                    return Ok(new { message = $"{targetSeason}. Sezon {nextEpisode.EpisodeNumber}. Bölüm izlendi!", season = targetSeason, episode = nextEpisode.EpisodeNumber, newStatus = (int)userShow.Status });
                }
            }

            // If not found in current season, try the next season
            var nextSeasonNumber = targetSeason + 1;
            var nextSeasonData = await _tmdbService.GetTvSeasonDetailsAsync(request.TmdbShowId, nextSeasonNumber);

            // If next season data exists, look for the first episode
            if (nextSeasonData != null && nextSeasonData.Episodes.Any())
            {
                var firstEp = nextSeasonData.Episodes.OrderBy(e => e.EpisodeNumber).First();
                _dbContext.WatchedEpisodes.Add(new WatchedEpisode
                {
                    UserShowId = userShow.Id,
                    SeasonNumber = nextSeasonNumber,
                    EpisodeNumber = firstEp.EpisodeNumber,
                    WatchedAt = DateTime.UtcNow
                });

                // Check if this was the absolute last episode (rare but possible for 1-ep seasons)
                string currentEpisodeInfo = $"S{nextSeasonNumber} E{firstEp.EpisodeNumber}";

                // If the show is completed, update the status
                if (userShow.ProductionStatus == "Ended" && userShow.LatestEpisodeInfo == currentEpisodeInfo)
                {
                    userShow.Status = WatchStatus.Completed;
                }

                await _dbContext.SaveChangesAsync();
                return Ok(new { message = $"{nextSeasonNumber}. Sezon {firstEp.EpisodeNumber}. Bölüm izlendi!", season = nextSeasonNumber, episode = firstEp.EpisodeNumber, newStatus = (int)userShow.Status });
            }

            return BadRequest("İzlenecek yeni bölüm bulunamadı (Dizi güncel olabilir).");
        }

        // Remove from library
        [HttpDelete("remove")]
        public async Task<IActionResult> RemoveFromLibrary([FromQuery] int tmdbId, [FromQuery] string type)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            if (type == "tv")
            {
                var show = await _dbContext.UserShows.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == tmdbId);
                if (show == null) return NotFound("Dizi listenizde bulunamadı.");
                _dbContext.UserShows.Remove(show);
            }
            else // movie
            {
                var movie = await _dbContext.UserMovies.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == tmdbId);
                if (movie == null) return NotFound("Film listenizde bulunamadı.");
                _dbContext.UserMovies.Remove(movie);
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Kütüphaneden kaldırıldı." });
        }

        // Rate item
        [HttpPut("rating")]
        public async Task<IActionResult> RateItem([FromBody] RateItemDto request)
        {
            if (request.Rating < 0 || request.Rating > 10) return BadRequest("Puan 0-10 arasında olmalı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

// Rate show
            if (request.Type == "tv")
            {
                var show = await _dbContext.UserShows.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);
                if (show == null)
                {
                    var details = await _tmdbService.GetTvShowDetailsAsync(request.TmdbId);
                    show = new UserShow
                    {
                        UserId = userId,
                        TmdbShowId = request.TmdbId,
                        ShowName = details?.Name ?? "Unknown",
                        PosterPath = details?.PosterPath,
                        FirstAirDate = details?.FirstAirDate,
                        Status = WatchStatus.Watching,
                        VoteAverage = details?.VoteAverage ?? 0,
                        ProductionStatus = details?.Status
                    };
                    _dbContext.UserShows.Add(show);
                }
                show.UserRating = request.Rating;
            }
            else // Rate movie
            {
                var movie = await _dbContext.UserMovies.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);
                if (movie == null)
                {
                    var details = await _tmdbService.GetMovieDetailsAsync(request.TmdbId);
                    movie = new UserMovie
                    {
                        UserId = userId,
                        TmdbMovieId = request.TmdbId,
                        Title = details?.Title ?? "Unknown",
                        PosterPath = details?.PosterPath,
                        ReleaseDate = details?.ReleaseDate,
                        Status = WatchStatus.Completed,
                        VoteAverage = details?.VoteAverage ?? 0
                    };
                    _dbContext.UserMovies.Add(movie);
                }
                movie.UserRating = request.Rating;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = $"Puan verildi: {request.Rating}/10 ⭐" });
        }

        // Add review to a content
        [HttpPut("review")]
        public async Task<IActionResult> AddReview([FromBody] AddReviewDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

// Review show
            if (request.Type == "tv")
            {
                var show = await _dbContext.UserShows.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbShowId == request.TmdbId);
                if (show == null) return BadRequest("Yorum yapmak için önce diziyi listenize ekleyin.");
                show.Review = request.Review;
            }
            else // Review movie
            {
                var movie = await _dbContext.UserMovies.FirstOrDefaultAsync(x => x.UserId == userId && x.TmdbMovieId == request.TmdbId);
                if (movie == null) return BadRequest("Yorum yapmak için önce filmi listenize ekleyin.");
                movie.Review = request.Review;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Notunuz kaydedildi!" });
        }

        // Maintenance Endpoint: Fix Broken Data
        [HttpGet("fix-data")]
        public async Task<IActionResult> FixData()
        {
            int fixedCount = 0;

            // Fix shows
            var brokenShows = await _dbContext.UserShows
                .Where(s => s.ShowName.Contains("Unknown") || s.VoteAverage == 0 || s.LatestEpisodeInfo == null || s.ProductionStatus == null)
                .ToListAsync();

            foreach (var show in brokenShows)
            {
                var details = await _tmdbService.GetTvShowDetailsAsync(show.TmdbShowId, "en-US");
                if (details != null)
                {
                    show.ShowName = details.Name ?? show.ShowName;
                    show.PosterPath = details.PosterPath;
                    show.FirstAirDate = details.FirstAirDate;
                    show.VoteAverage = details.VoteAverage;
                    show.NextAirDate = details.NextEpisodeToAir?.AirDate;
                    show.ProductionStatus = details.Status;

                    if (details.LastEpisodeToAir != null)
                    {
                        show.LatestEpisodeInfo = $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
                    }
                    fixedCount++;
                }
            }

            // Fix movies
            var brokenMovies = await _dbContext.UserMovies
                .Where(m => m.Title.Contains("Unknown") || m.VoteAverage == 0)
                .ToListAsync();

            foreach (var movie in brokenMovies)
            {
                var details = await _tmdbService.GetMovieDetailsAsync(movie.TmdbMovieId, "en-US");
                if (details != null)
                {
                    movie.Title = details.Title ?? movie.Title;
                    movie.PosterPath = details.PosterPath;
                    movie.ReleaseDate = details.ReleaseDate;
                    movie.VoteAverage = details.VoteAverage;
                    fixedCount++;
                }
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = $"Veri onarımı tamamlandı. Toplam {fixedCount} içerik güncellendi." });
        }

        // Sync library with TMDB to latest data
        [HttpPost("library/sync")]
        public async Task<IActionResult> SyncLibrary()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var userShows = await _dbContext.UserShows.Where(x => x.UserId == userId).ToListAsync();
            int updatedCount = 0;

            foreach (var show in userShows)
            {
                var details = await _tmdbService.GetTvShowDetailsAsync(show.TmdbShowId, "en-US");
                if (details != null)
                {
                    bool hasChanges = false;
                    string? freshLatestInfo = null;
                    
                    // Update latest episode info
                    if (details.LastEpisodeToAir != null)
                    {
                        freshLatestInfo = $"S{details.LastEpisodeToAir.SeasonNumber} E{details.LastEpisodeToAir.EpisodeNumber}";
                    }

                    if (show.LatestEpisodeInfo != freshLatestInfo) { show.LatestEpisodeInfo = freshLatestInfo; hasChanges = true; }
                    if (show.NextAirDate != details.NextEpisodeToAir?.AirDate) { show.NextAirDate = details.NextEpisodeToAir?.AirDate; hasChanges = true; }
                    if (Math.Abs(show.VoteAverage - details.VoteAverage) > 0.1) { show.VoteAverage = details.VoteAverage; hasChanges = true; }
                    if (show.ProductionStatus != details.Status) { show.ProductionStatus = details.Status; hasChanges = true; }

                    if (hasChanges) updatedCount++;
                }
            }

            if (updatedCount > 0) await _dbContext.SaveChangesAsync();
            return Ok(new { message = $"Kütüphane güncellendi. {updatedCount} içerik yenilendi." });
        }
    }
}