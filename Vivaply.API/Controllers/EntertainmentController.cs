using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using Vivaply.API.DTOs.Entertainment.Commands.Games;
using Vivaply.API.DTOs.Entertainment.Commands.Media;
using Vivaply.API.Services.Entertainment.Discovery;
using Vivaply.API.Services.Entertainment.Game;
using Vivaply.API.Services.Entertainment.Media;
using Vivaply.API.Services.Infrastructure.RateLimiting;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EntertainmentController : ControllerBase
    {
        private readonly IGameService _gameService;
        private readonly IMediaService _mediaService;
        private readonly IDiscoveryService _discoveryService;

        public EntertainmentController(IGameService gameService, IMediaService mediaService, IDiscoveryService discoveryService)
        {
            _gameService = gameService;
            _mediaService = mediaService;
            _discoveryService = discoveryService;
        }

        // TV search
        [HttpGet("tv/search")]
        public async Task<IActionResult> SearchTv(
            [FromQuery] string query,
            [FromQuery] string language = "en-US")
        {
            return Ok(await _discoveryService.SearchTvAsync(query, language));
        }

        // TV trending
        [HttpGet("tv/trending")]
        public async Task<IActionResult> TrendingTv(
            [FromQuery] string language = "en-US")
        {
            return Ok(await _discoveryService.GetTrendingTvAsync(language));
        }

        // Movie search
        [HttpGet("movie/search")]
        public async Task<IActionResult> SearchMovie(
            [FromQuery] string query,
            [FromQuery] string language = "en-US")
        {
            return Ok(await _discoveryService.SearchMovieAsync(query, language));
        }

        // Movie trending
        [HttpGet("movie/trending")]
        public async Task<IActionResult> TrendingMovie(
            [FromQuery] string language = "en-US")
        {
            return Ok(await _discoveryService.GetTrendingMovieAsync(language));
        }

        // Game search
        [HttpGet("game/search")]
        public async Task<IActionResult> SearchGames([FromQuery] string query)
        {
            var results = await _discoveryService.SearchGameAsync(query);
            return Ok(results);
        }

        // Game trending
        [HttpGet("game/trending")]
        public async Task<IActionResult> GetTrendingGames()
        {
            var results = await _discoveryService.GetTrendingGameAsync();
            return Ok(results);
        }

        // Getting TMDB TV Show Details
        [HttpGet("tv/{id}")]
        public async Task<IActionResult> GetTvDetail(int id, [FromQuery] string language = "en-US")
        {
            var userId = GetUserIdOrNull();

            var result = await _mediaService.GetTvShowDetailAsync(userId, id, language);

            if (result == null)
                return NotFound("TV show not found.");

            return Ok(result);
        }

        // Getting TMDB Movie Details
        [HttpGet("movie/{id}")]
        public async Task<IActionResult> GetMovieDetail(int id, [FromQuery] string language = "en-US")
        {
            var result = await _mediaService.GetMovieDetailAsync(GetUserIdOrNull(), id, language);
            return result == null ? NotFound() : Ok(result);
        }

        // Getting IGDB Game Details
        [HttpGet("game/{id:int}")]
        public async Task<IActionResult> GetGameDetail(int id)
        {
            var userId = GetUserIdOrNull();

            var game = await _gameService.GetDetailAsync(userId, id);
            return game == null
                ? NotFound("The game could not be found.")
                : Ok(game);
        }

        // Getting TMDB TV Season Details
        [HttpGet("tv/{id}/season/{seasonNumber}")]
        public async Task<IActionResult> GetSeasonDetail(
            int id,
            int seasonNumber,
            [FromQuery] string language = "en-US"
        )
        {
            var result = await _mediaService.GetSeasonDetailAsync(
                GetUserIdOrNull(),
                id,
                seasonNumber,
                language
            );

            if (result == null)
                return NotFound("Season not found.");

            return Ok(result);
        }

        // Getting User Library
        [HttpGet("library")]
        public async Task<IActionResult> GetLibrary()
        {
            return Ok(await _mediaService.GetUserLibraryAsync(GetUserId()));
        }

        // Entertainment Library Management Endpoints

        // Track an item to library
        [HttpPost("track")]
        public async Task<IActionResult> Track([FromBody] AddMediaToLibraryDto request)
        {
            await _mediaService.AddMediaToLibraryAsync(GetUserId(), request);
            return Ok(new { message = "Added to library." });
        }

        // Update an item's watch status (Watched, To Watch, etc.)
        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateMediaStatusDto request)
        {
            await _mediaService.UpdateMediaStatusAsync(GetUserId(), request);

            return Ok(new { message = "Status updated." });
        }

        // Combined Update for Progress (Status, Rating, Review)
        [HttpPut("progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateMediaProgressDto request)
        {
            await _mediaService.UpdateMediaProgressAsync(GetUserId(), request);

            return Ok(new { message = "Progress updated." });
        }

        // Toggle an episode's watch status
        [HttpPost("episode/toggle")]
        public async Task<IActionResult> ToggleEpisode([FromBody] ToggleEpisodeDto request)
        {
            var result = await _mediaService.ToggleEpisodeAsync(
                GetUserId(),
                request.TmdbShowId,
                request.SeasonNumber,
                request.EpisodeNumber
            );

            return Ok(result);
        }

        // Mark a season as watched
        [HttpPost("episode/mark-season")]
        public async Task<IActionResult> MarkSeason([FromBody] MarkSeasonWatchedDto request)
        {
            return Ok(await _mediaService.MarkSeasonWatchedAsync(
                GetUserId(),
                request.TmdbShowId,
                request.SeasonNumber
            ));
        }

        // Watch the next episode
        [HttpPost("episode/watch-next")]
        public async Task<IActionResult> WatchNext([FromBody] WatchNextEpisodeDto request)
        {
            return Ok(await _mediaService.WatchNextEpisodeAsync(
                GetUserId(),
                request.TmdbShowId
            ));
        }

        // Remove from library
        [HttpDelete("remove")]
        public async Task<IActionResult> Remove([FromQuery] int tmdbId, [FromQuery] string type)
        {
            await _mediaService.RemoveMediaFromLibraryAsync(GetUserId(), tmdbId, type);
            return Ok(new { message = "Removed from library." });
        }

        // Rate item
        [HttpPut("rating")]
        public async Task<IActionResult> Rate([FromBody] RateMediaDto request)
        {
            await _mediaService.RateMediaAsync(GetUserId(), request);
            return Ok(new { message = "Rating saved." });
        }

        // Add review to a content
        [HttpPut("review")]
        public async Task<IActionResult> Review([FromBody] AddMediaReviewDto request)
        {
            await _mediaService.AddMediaReviewAsync(GetUserId(), request);
            return Ok(new { message = "Review saved." });
        }

        // Maintenance Endpoint: Fix Broken Data
        [HttpGet("fix-data")]
        public async Task<IActionResult> FixData()
        {
            var count = await _mediaService.FixBrokenMediaDataAsync();
            return Ok(new { updated = count });
        }

        // Sync library with TMDB to latest data
        [EnableRateLimiting(RateLimitPolicies.MediaSync)]
        [HttpPost("library/sync")]
        public async Task<IActionResult> SyncLibrary()
        {
            var count = await _mediaService.SyncMediaLibraryAsync(GetUserId());
            return Ok(new { updated = count });
        }

        // Game Library
        [HttpGet("game/library")]
        public async Task<IActionResult> GetGameLibrary()
        {
            var userId = GetUserId();
            var library = await _gameService.GetLibraryAsync(userId);
            return Ok(library);
        }

        [HttpPost("game/track")]
        public async Task<IActionResult> TrackGame([FromBody] TrackGameDto request)
        {
            await _gameService.AddToLibraryAsync(GetUserId(), request);
            return Ok(new { message = "Oyun kütüphaneye eklendi." });
        }

        [HttpPut("game/status")]
        public async Task<IActionResult> UpdateGameStatus([FromBody] UpdateGameStatusDto request)
        {
            await _gameService.UpdateStatusAsync(GetUserId(), request);
            return Ok(new { message = "Durum güncellendi." });
        }

        [HttpPut("game/progress")]
        public async Task<IActionResult> UpdateGameProgress([FromBody] UpdateGameProgressDto request)
        {
            await _gameService.UpdateProgressAsync(GetUserId(), request);
            return Ok(new { message = "Oyun ilerlemesi güncellendi." });
        }

        [HttpPut("game/rating")]
        public async Task<IActionResult> RateGame([FromBody] RateGameDto request)
        {
            await _gameService.RateAsync(GetUserId(), request);
            return Ok(new { message = "Puan kaydedildi." });
        }

        [HttpPut("game/review")]
        public async Task<IActionResult> AddGameReview([FromBody] AddGameReviewDto request)
        {
            await _gameService.AddReviewAsync(GetUserId(), request);
            return Ok(new { message = "Not kaydedildi." });
        }

        [HttpDelete("game/remove/{id:int}")]
        public async Task<IActionResult> RemoveGame(int id)
        {
            await _gameService.RemoveAsync(GetUserId(), id);
            return Ok(new { message = "Oyun kütüphaneden kaldırıldı." });
        }

        // --- Private Helpers ---

        private Guid GetUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (!Guid.TryParse(userIdString, out var userId))
                throw new UnauthorizedAccessException();

            return userId;
        }

        private Guid? GetUserIdOrNull()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(userIdString, out var userId) ? userId : null;
        }

    }
}