using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Controllers
{
    [Authorize]
    [Route("api/discovery")]
    public class DiscoveryController(IDiscoveryService discoveryService) : BaseApiController
    {
        private readonly IDiscoveryService _discoveryService = discoveryService;

        [HttpGet("tv/search")]
        public async Task<IActionResult> SearchTv(string query, string language = "en-US")
            => Ok(await _discoveryService.SearchTvAsync(query, language));

        [HttpGet("tv/trending")]
        public async Task<IActionResult> TrendingTv(string language = "en-US")
            => Ok(await _discoveryService.GetTrendingTvAsync(language));

        [HttpGet("movies/search")]
        public async Task<IActionResult> SearchMovie(string query, string language = "en-US")
            => Ok(await _discoveryService.SearchMovieAsync(query, language));

        [HttpGet("movies/trending")]
        public async Task<IActionResult> TrendingMovie(string language = "en-US")
            => Ok(await _discoveryService.GetTrendingMovieAsync(language));

        [HttpGet("games/search")]
        public async Task<IActionResult> SearchGames(string query)
            => Ok(await _discoveryService.SearchGameAsync(query));

        [HttpGet("games/trending")]
        public async Task<IActionResult> TrendingGames()
            => Ok(await _discoveryService.GetTrendingGameAsync());
    }
}