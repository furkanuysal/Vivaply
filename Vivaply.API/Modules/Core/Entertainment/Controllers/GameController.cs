using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Games;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Controllers
{
    [Authorize]
    [Route("api/games")]
    public class GameController(IGameService gameService) : BaseApiController
    {
        private readonly IGameService _gameService = gameService;

        // ---------- DETAILS ----------

        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var result = await _gameService.GetDetailAsync(CurrentUserId, id);
            return result == null ? NotFound() : Ok(result);
        }

        // ---------- LIBRARY ----------

        [HttpGet("library")]
        public async Task<IActionResult> GetLibrary()
        {
            return Ok(await _gameService.GetLibraryAsync(CurrentUserId));
        }

        [HttpPost]
        public async Task<IActionResult> Track([FromBody] TrackGameDto request)
        {
            await _gameService.AddToLibraryAsync(CurrentUserId, request);
            return Ok(new { message = "Game added to library." });
        }

        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateGameStatusDto request)
        {
            await _gameService.UpdateStatusAsync(CurrentUserId, request);
            return Ok(new { message = "Status updated." });
        }

        [HttpPut("progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateGameProgressDto request)
        {
            await _gameService.UpdateProgressAsync(CurrentUserId, request);
            return Ok(new { message = "Progress updated." });
        }

        [HttpPut("rating")]
        public async Task<IActionResult> Rate([FromBody] RateGameDto request)
        {
            await _gameService.RateAsync(CurrentUserId, request);
            return Ok(new { message = "Rating saved." });
        }

        [HttpPut("review")]
        public async Task<IActionResult> Review([FromBody] AddGameReviewDto request)
        {
            await _gameService.AddReviewAsync(CurrentUserId, request);
            return Ok(new { message = "Review saved." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Remove(int id)
        {
            await _gameService.RemoveAsync(CurrentUserId, id);
            return Ok(new { message = "Game removed from library." });
        }
    }
}