using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Knowledge.DTOs.Commands.Book;
using Vivaply.API.Modules.Core.Knowledge.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Knowledge.Controllers
{
    [Authorize]
    [Route("api/books")]
    public class BookController(IBookService bookService) : BaseApiController
    {
        private readonly IBookService _bookService = bookService;

        // ---------- DISCOVERY ----------

        [HttpGet("search")]
        public async Task<IActionResult> Search(string query)
            => Ok(await _bookService.SearchAsync(query));

        [HttpGet("discover")]
        public async Task<IActionResult> Discover(string lang = "en")
            => Ok(await _bookService.DiscoverAsync(lang));

        // ---------- DETAILS ----------

        [HttpGet("{id}")]
        public async Task<IActionResult> Detail(string id)
            => Ok(await _bookService.GetDetailAsync(CurrentUserId, id));

        // ---------- LIBRARY ----------

        [HttpGet("library")]
        public async Task<IActionResult> Library()
            => Ok(await _bookService.GetLibraryAsync(CurrentUserId));

        [HttpPost]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Track(AddBookDto dto)
        {
            await _bookService.TrackAsync(CurrentUserId, dto);
            return Ok(new { message = "Book added to library." });
        }

        [HttpPut("status")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Status(UpdateBookStatusDto dto)
        {
            await _bookService.UpdateStatusAsync(CurrentUserId, dto);
            return Ok(new { message = "Status updated." });
        }

        [HttpPut("progress")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Progress(UpdateBookProgressDto dto)
        {
            await _bookService.UpdateProgressAsync(CurrentUserId, dto);
            return Ok(new { message = "Progress updated." });
        }

        [HttpPut("rating")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Rate(RateBookDto dto)
        {
            await _bookService.RateAsync(CurrentUserId, dto);
            return Ok(new { message = "Rating saved." });
        }

        [HttpPut("review")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Review(ReviewBookDto dto)
        {
            await _bookService.ReviewAsync(CurrentUserId, dto);
            return Ok(new { message = "Review saved." });
        }

        [HttpDelete("{id}")]
        [EnableRateLimiting(RateLimitPolicies.LibraryWrite)]
        public async Task<IActionResult> Remove(string id)
        {
            await _bookService.RemoveAsync(CurrentUserId, id);
            return Ok(new { message = "Book removed from library." });
        }
    }
}
