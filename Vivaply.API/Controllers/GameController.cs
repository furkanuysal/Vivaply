using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Igdb;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Services.Igdb;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/Entertainment/[controller]")]
    [ApiController]
    public class GameController : ControllerBase
    {
        private readonly IIgdbService _igdbService;
        private readonly VivaplyDbContext _dbContext;

        public GameController(IIgdbService igdbService, VivaplyDbContext dbContext)
        {
            _igdbService = igdbService;
            _dbContext = dbContext;
        }

        // Search
        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            var results = await _igdbService.SearchGamesAsync(query);
            return Ok(results); // return gamecontentdto list
        }

        // Trending
        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            var results = await _igdbService.GetTrendingGamesAsync();
            return Ok(results);
        }

        // Get Detail
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var game = await _igdbService.GetGameDetailAsync(id);
            if (game == null) return NotFound("Oyun bulunamadı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out var userId))
            {
                var userGame = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == id);
                if (userGame != null)
                {
                    // Auto-Update Puan
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
                }
            }
            return Ok(game);
        }

        // Library
        [HttpGet("library")]
        public async Task<IActionResult> GetLibrary()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var userGames = await _dbContext.UserGames
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .ToListAsync();

            // Entity -> DTO
            var dtos = userGames.Select(x => new GameContentDto
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
            });

            return Ok(dtos);
        }

        // Track
        [HttpPost("track")]
        public async Task<IActionResult> TrackGame([FromBody] TrackGameDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            if (await _dbContext.UserGames.AnyAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId))
                return BadRequest("Bu oyun zaten kütüphanenizde.");

            // Fetch details from IGDB and store
            var details = await _igdbService.GetGameDetailAsync(request.IgdbId);
            if (details == null) return NotFound("Oyun bilgisi alınamadı.");

            var newGame = new UserGame
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
                UserPlatform = request.UserPlatform
            };

            _dbContext.UserGames.Add(newGame);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Oyun kütüphaneye eklendi!" });
        }

        // Update Status
        [HttpPut("status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateGameStatusDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var game = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);
            if (game == null) return NotFound("Oyun kütüphanenizde bulunamadı.");

            game.Status = request.Status;
            if (request.Status == PlayStatus.Completed) game.DateFinished = DateTime.UtcNow;

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Durum güncellendi." });
        }
        // Update Progress
        [HttpPut("progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateGameProgressDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var game = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);
            if (game == null) return NotFound("Oyun kütüphanenizde bulunamadı.");

            // Update fields
            game.UserPlaytime = request.UserPlaytime;
            game.CompletionType = request.CompletionType;
            if (!string.IsNullOrEmpty(request.UserPlatform))
            {
                game.UserPlatform = request.UserPlatform;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Oyun detayları kaydedildi." });
        }

        // Rate
        [HttpPut("rating")]
        public async Task<IActionResult> RateGame([FromBody] RateGameDto request)
        {
            if (request.Rating < 0 || request.Rating > 10) return BadRequest("Puan 0-10 olmalı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var game = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            // If not tracked, fetch details and add to library
            if (game == null)
            {
                var details = await _igdbService.GetGameDetailAsync(request.IgdbId);
                if (details != null)
                {
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
                        Status = PlayStatus.Playing, // Default to Playing
                        VoteAverage = details.VoteAverage
                    };
                    _dbContext.UserGames.Add(game);
                }
            }

            if (game != null) game.UserRating = request.Rating;

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = $"Puan verildi: {request.Rating}/10 ⭐" });
        }

        // Review
        [HttpPut("review")]
        public async Task<IActionResult> AddReview([FromBody] AddGameReviewDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var game = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == request.IgdbId);

            if (game == null) return BadRequest("Yorum yapmak için önce oyunu kütüphanenize ekleyin.");

            game.Review = request.Review;
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Notunuz kaydedildi!" });
        }

        // Remove
        [HttpDelete("remove/{id}")]
        public async Task<IActionResult> RemoveGame(int id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var game = await _dbContext.UserGames.FirstOrDefaultAsync(x => x.UserId == userId && x.IgdbId == id);
            if (game == null) return NotFound();

            _dbContext.UserGames.Remove(game);
            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Oyun kütüphaneden kaldırıldı." });
        }
    }
}
