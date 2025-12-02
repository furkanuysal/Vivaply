using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Services;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class EntertainmentController : ControllerBase
    {
        private readonly ITmdbService _tmdbService;

        public EntertainmentController(ITmdbService tmdbService)
        {
            _tmdbService = tmdbService;
        }

        // TV Shows
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

        [HttpGet("tv/{id}")]
        public async Task<IActionResult> GetTvDetail(int id, [FromQuery] string language = "en-US")
        {
            var result = await _tmdbService.GetTvShowDetailsAsync(id, language);
            if (result == null) return NotFound("Dizi bulunamadı.");
            return Ok(result);
        }

        // Movies
        [HttpGet("movie/search")]
        public async Task<IActionResult> SearchMovie([FromQuery] string query, [FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.SearchMoviesAsync(query, language);
            return Ok(results);
        }

        [HttpGet("movie/trending")]
        public async Task<IActionResult> GetTrendingMovie([FromQuery] string language = "en-US")
        {
            var results = await _tmdbService.GetTrendingMoviesAsync(language);
            return Ok(results);
        }

        [HttpGet("movie/{id}")]
        public async Task<IActionResult> GetMovieDetail(int id, [FromQuery] string language = "en-US")
        {
            var result = await _tmdbService.GetMovieDetailsAsync(id, language);
            if (result == null) return NotFound("Film bulunamadı.");
            return Ok(result);
        }
    }
}