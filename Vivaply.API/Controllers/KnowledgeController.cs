using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vivaply.API.DTOs.Knowledge.Commands.Book;
using Vivaply.API.Services.Knowledge.Book;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class KnowledgeController : ControllerBase
    {
        private readonly IBookService _bookService;

        public KnowledgeController(IBookService bookService)
        {
            _bookService = bookService;
        }

        private Guid UserId =>
            Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("book/search")]
        public async Task<IActionResult> Search(string query)
            => Ok(await _bookService.SearchAsync(query));

        [HttpGet("book/{id}")]
        public async Task<IActionResult> Detail(string id)
            => Ok(await _bookService.GetDetailAsync(UserId, id));

        [HttpGet("book/library")]
        public async Task<IActionResult> Library()
            => Ok(await _bookService.GetLibraryAsync(UserId));

        [HttpPost("book/track")]
        public async Task<IActionResult> Track(AddBookDto dto)
        {
            await _bookService.TrackAsync(UserId, dto);
            return Ok();
        }

        [HttpPut("book/status")]
        public async Task<IActionResult> Status(UpdateBookStatusDto dto)
        {
            await _bookService.UpdateStatusAsync(UserId, dto);
            return Ok();
        }

        [HttpPut("book/progress")]
        public async Task<IActionResult> Progress(UpdateBookProgressDto dto)
        {
            await _bookService.UpdateProgressAsync(UserId, dto);
            return Ok();
        }

        [HttpPut("book/rating")]
        public async Task<IActionResult> Rate(RateBookDto dto)
        {
            await _bookService.RateAsync(UserId, dto);
            return Ok();
        }

        [HttpPut("book/review")]
        public async Task<IActionResult> Review(ReviewBookDto dto)
        {
            await _bookService.ReviewAsync(UserId, dto);
            return Ok();
        }

        [HttpDelete("book/remove/{id}")]
        public async Task<IActionResult> Remove(string id)
        {
            await _bookService.RemoveAsync(UserId, id);
            return Ok();
        }
    }
}