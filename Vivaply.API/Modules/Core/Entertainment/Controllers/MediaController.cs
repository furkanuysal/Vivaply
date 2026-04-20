using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Media;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Controllers
{
    [Authorize]
    [Route("api/media")]
    public class MediaController(IMediaService mediaService) : BaseApiController
    {
        private readonly IMediaService _mediaService = mediaService;

        // ---------- DETAILS ----------

        [HttpGet("tv/{id}")]
        public async Task<IActionResult> GetTv(int id, string language = "en-US")
        {
            var result = await _mediaService.GetTvShowDetailAsync(CurrentUserId, id, language);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpGet("movies/{id}")]
        public async Task<IActionResult> GetMovie(int id, string language = "en-US")
        {
            var result = await _mediaService.GetMovieDetailAsync(CurrentUserId, id, language);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpGet("tv/{id}/seasons/{seasonNumber}")]
        public async Task<IActionResult> GetSeason(int id, int seasonNumber, string language = "en-US")
        {
            var result = await _mediaService.GetSeasonDetailAsync(
                CurrentUserId,
                id,
                seasonNumber,
                language
            );

            return result == null ? NotFound() : Ok(result);
        }

        // ---------- LIBRARY ----------

        [HttpGet("library")]
        public async Task<IActionResult> GetLibrary()
        {
            return Ok(await _mediaService.GetUserLibraryAsync(CurrentUserId));
        }

        [HttpPost]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Track([FromBody] AddMediaToLibraryDto request)
        {
            await _mediaService.AddMediaToLibraryAsync(CurrentUserId, request);
            return Ok(new { message = "Added to library." });
        }

        [HttpPut("status")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateMediaStatusDto request)
        {
            await _mediaService.UpdateMediaStatusAsync(CurrentUserId, request);
            return Ok(new { message = "Status updated." });
        }

        [HttpPut("progress")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateMediaProgressDto request)
        {
            await _mediaService.UpdateMediaProgressAsync(CurrentUserId, request);
            return Ok(new { message = "Progress updated." });
        }

        [HttpPut("rating")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Rate([FromBody] RateMediaDto request)
        {
            await _mediaService.RateMediaAsync(CurrentUserId, request);
            return Ok(new { message = "Rating saved." });
        }

        [HttpPut("review")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Review([FromBody] AddMediaReviewDto request)
        {
            await _mediaService.AddMediaReviewAsync(CurrentUserId, request);
            return Ok(new { message = "Review saved." });
        }

        [HttpDelete("{type}/{id}")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Remove(string type, int id)
        {
            await _mediaService.RemoveMediaFromLibraryAsync(CurrentUserId, id, type);
            return Ok(new { message = "Removed from library." });
        }

        // ---------- EPISODES ----------

        [HttpPost("episodes/toggle")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> ToggleEpisode([FromBody] ToggleEpisodeDto request)
        {
            var result = await _mediaService.ToggleEpisodeAsync(
                CurrentUserId,
                request.TmdbShowId,
                request.SeasonNumber,
                request.EpisodeNumber
            );

            return Ok(result);
        }

        [HttpPost("episodes/mark-season")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> MarkSeason([FromBody] MarkSeasonWatchedDto request)
        {
            return Ok(await _mediaService.MarkSeasonWatchedAsync(
                CurrentUserId,
                request.TmdbShowId,
                request.SeasonNumber
            ));
        }

        [HttpPost("episodes/watch-next")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> WatchNext([FromBody] WatchNextEpisodeDto request)
        {
            return Ok(await _mediaService.WatchNextEpisodeAsync(
                CurrentUserId,
                request.TmdbShowId
            ));
        }
    }
}
