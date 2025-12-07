using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vivaply.API.Data;
using Vivaply.API.DTOs;
using Vivaply.API.DTOs.GoogleBooks;
using Vivaply.API.Entities.Knowledge;
using Vivaply.API.Services;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class KnowledgeController : ControllerBase
    {
        private readonly IGoogleBooksService _booksService;
        private readonly VivaplyDbContext _dbContext;

        public KnowledgeController(IGoogleBooksService booksService, VivaplyDbContext dbContext)
        {
            _booksService = booksService;
            _dbContext = dbContext;
        }

        // Search Books
        // URL: /api/Knowledge/books/search
        [HttpGet("books/search")]
        public async Task<IActionResult> Search([FromQuery] string query)
        {
            var results = await _booksService.SearchBooksAsync(query);
            return Ok(results);
        }

        // Book Details
        // URL: /api/Knowledge/books/{id}
        [HttpGet("books/{id}")]
        public async Task<IActionResult> GetDetail(string id)
        {
            var book = await _booksService.GetBookDetailsAsync(id);
            if (book == null) return NotFound("Kitap bulunamadı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out var userId))
            {
                var userBook = await _dbContext.UserBooks
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == id);

                if (userBook != null)
                {
                    book.UserStatus = userBook.Status;
                    book.CurrentPage = userBook.CurrentPage;
                    book.UserRating = userBook.UserRating;
                    book.UserReview = userBook.Review;
                }
            }
            return Ok(book);
        }

        // Book Library
        // URL: /api/Knowledge/books/library
        [HttpGet("books/library")]
        public async Task<IActionResult> GetLibrary()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var books = await _dbContext.UserBooks
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .ToListAsync();

            var dtos = books.Select(b => new BookContentDto
            {
                Id = b.GoogleBookId,
                Title = b.Title,
                Authors = b.Authors.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(a => a.Trim()).ToList(),
                CoverUrl = b.CoverUrl,
                PageCount = b.PageCount,
                UserStatus = b.Status,
                CurrentPage = b.CurrentPage,
                UserRating = b.UserRating,
                UserReview = b.Review
            });

            return Ok(dtos);
        }

        // Add Book to Library
        [HttpPost("books/track")]
        public async Task<IActionResult> TrackBook([FromBody] AddBookDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var existingBook = await _dbContext.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (existingBook != null) return BadRequest("Bu kitap zaten kütüphanenizde.");

            var newBook = new UserBook
            {
                UserId = userId,
                GoogleBookId = request.GoogleBookId,
                Title = request.Title,
                Authors = string.Join(", ", request.Authors),
                CoverUrl = request.CoverUrl,
                PageCount = request.PageCount,
                Status = request.Status,
                DateAdded = DateTime.UtcNow
            };

            _dbContext.UserBooks.Add(newBook);
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Kitap kütüphaneye eklendi!" });
        }

        // Update Book Status
        [HttpPut("books/status")]
        public async Task<IActionResult> UpdateStatus([FromBody] UpdateBookStatusDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var book = await _dbContext.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (book == null) return NotFound("Kitap kütüphanenizde bulunamadı.");

            book.Status = request.Status;

            if (request.Status == ReadStatus.Completed)
            {
                book.CurrentPage = book.PageCount;
                book.DateFinished = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Durum güncellendi." });
        }

        // Update Book Progress
        [HttpPut("books/progress")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateBookProgressDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var book = await _dbContext.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (book == null) return NotFound("Kitap bulunamadı.");

            if (request.CurrentPage > book.PageCount) request.CurrentPage = book.PageCount;

            book.CurrentPage = request.CurrentPage;

            if (book.CurrentPage == book.PageCount && book.Status != ReadStatus.Completed)
            {
                book.Status = ReadStatus.Completed;
                book.DateFinished = DateTime.UtcNow;
            }

            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "İlerleme kaydedildi." });
        }

        // Delete Book from Library
        [HttpDelete("books/remove/{id}")]
        public async Task<IActionResult> RemoveBook(string id)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var book = await _dbContext.UserBooks.FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == id);
            if (book == null) return NotFound();

            _dbContext.UserBooks.Remove(book);
            await _dbContext.SaveChangesAsync();
            return Ok(new { message = "Kitap kütüphaneden kaldırıldı." });
        }

        // Book Review
        [HttpPut("books/rating")]
        public async Task<IActionResult> RateBook([FromBody] RateBookDto request)
        {
            if (request.Rating < 0 || request.Rating > 10) return BadRequest("Puan 0-10 arasında olmalı.");

            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var book = await _dbContext.UserBooks.FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            // If the book is not tracked yet, add it first
            if (book == null)
            {
                var details = await _booksService.GetBookDetailsAsync(request.GoogleBookId);
                if (details == null) return NotFound("Kitap bulunamadı.");

                book = new UserBook
                {
                    UserId = userId,
                    GoogleBookId = request.GoogleBookId,
                    Title = details.Title,
                    Authors = string.Join(", ", details.Authors),
                    CoverUrl = details.CoverUrl,
                    PageCount = details.PageCount,
                    Status = ReadStatus.Reading, // Default status when rating
                    DateAdded = DateTime.UtcNow
                };
                _dbContext.UserBooks.Add(book);
            }

            book.UserRating = request.Rating;
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = $"Puan verildi: {request.Rating}/10 ⭐" });
        }

        // Review Book
        [HttpPut("books/review")]
        public async Task<IActionResult> AddReview([FromBody] ReviewBookDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId)) return Unauthorized();

            var book = await _dbContext.UserBooks.FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (book == null) return BadRequest("Yorum yapmak için önce kitabı kütüphanenize ekleyin.");

            book.Review = request.Review;
            await _dbContext.SaveChangesAsync();

            return Ok(new { message = "Notunuz kaydedildi!" });
        }
    }
}