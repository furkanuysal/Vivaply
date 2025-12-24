using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Knowledge.Commands.Book;
using Vivaply.API.DTOs.Knowledge.GoogleBooks;
using Vivaply.API.Entities.Knowledge;
using Vivaply.API.Services.Knowledge.GoogleBooks;

namespace Vivaply.API.Services.Knowledge.Book
{
    public class BookService : IBookService
    {
        private readonly VivaplyDbContext _db;
        private readonly IGoogleBooksService _googleBooks;

        public BookService(VivaplyDbContext db, IGoogleBooksService googleBooks)
        {
            _db = db;
            _googleBooks = googleBooks;
        }

        // --- Discovery ---
        public Task<List<BookContentDto>> SearchAsync(string query)
            => _googleBooks.SearchBooksAsync(query);

        public async Task<BookContentDto?> GetDetailAsync(Guid userId, string googleBookId)
        {
            var book = await _googleBooks.GetBookDetailsAsync(googleBookId);
            if (book == null) return null;

            var userBook = await _db.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId);

            if (userBook != null)
            {
                book.UserStatus = userBook.Status;
                book.CurrentPage = userBook.CurrentPage;
                book.UserRating = userBook.UserRating;
                book.UserReview = userBook.Review;
            }

            return book;
        }

        // --- Library ---
        public async Task<List<BookContentDto>> GetLibraryAsync(Guid userId)
        {
            var books = await _db.UserBooks
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .ToListAsync();

            return books.Select(b => new BookContentDto
            {
                Id = b.GoogleBookId,
                Title = b.Title,
                Authors = b.Authors
                    .Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(a => a.Trim())
                    .ToList(),
                CoverUrl = b.CoverUrl,
                PageCount = b.PageCount,
                UserStatus = b.Status,
                CurrentPage = b.CurrentPage,
                UserRating = b.UserRating,
                UserReview = b.Review
            }).ToList();
        }


        public async Task TrackAsync(Guid userId, AddBookDto request)
        {
            if (await _db.UserBooks.AnyAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId))
                throw new InvalidOperationException("Bu kitap zaten kütüphanede.");

            _db.UserBooks.Add(new UserBook
            {
                UserId = userId,
                GoogleBookId = request.GoogleBookId,
                Title = request.Title,
                Authors = string.Join(", ", request.Authors),
                CoverUrl = request.CoverUrl,
                PageCount = request.PageCount,
                Status = request.Status,
                DateAdded = DateTime.UtcNow,
                DateFinished = request.Status == ReadStatus.Completed ? DateTime.UtcNow : null
            });

            await _db.SaveChangesAsync();
        }

        public async Task RemoveAsync(Guid userId, string googleBookId)
        {
            var book = await _db.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId);

            if (book == null)
                throw new KeyNotFoundException("Kitap bulunamadı.");

            _db.UserBooks.Remove(book);
            await _db.SaveChangesAsync();
        }

        // --- Progress / Status ---
        public async Task UpdateStatusAsync(Guid userId, UpdateBookStatusDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);

            book.Status = request.Status;

            if (request.Status == ReadStatus.Completed)
            {
                book.CurrentPage = book.PageCount;
                if (book.DateFinished == null) book.DateFinished = DateTime.UtcNow;
            }
            else
            {
                book.DateFinished = null;
            }

            await _db.SaveChangesAsync();
        }

        public async Task UpdateProgressAsync(Guid userId, UpdateBookProgressDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);

            book.CurrentPage = Math.Min(request.CurrentPage, book.PageCount);

            if (book.CurrentPage == book.PageCount)
            {
                book.Status = ReadStatus.Completed;
                if (book.DateFinished == null)
                    book.DateFinished = DateTime.UtcNow;
            }
            else
            {
                if (book.Status == ReadStatus.Completed)
                {
                    book.Status = ReadStatus.Reading;
                    book.DateFinished = null;
                }
            }

            await _db.SaveChangesAsync();
        }

        // --- Rating / Review ---
        public async Task RateAsync(Guid userId, RateBookDto request)
        {
            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(nameof(request.Rating));

            var book = await _db.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (book == null)
            {
                var details = await _googleBooks.GetBookDetailsAsync(request.GoogleBookId)
                    ?? throw new KeyNotFoundException("Kitap bulunamadı.");

                book = new UserBook
                {
                    UserId = userId,
                    GoogleBookId = request.GoogleBookId,
                    Title = details.Title,
                    Authors = string.Join(", ", details.Authors),
                    CoverUrl = details.CoverUrl,
                    PageCount = details.PageCount,
                    Status = ReadStatus.Reading,
                    DateAdded = DateTime.UtcNow
                };

                _db.UserBooks.Add(book);
            }

            book.UserRating = request.Rating;
            await _db.SaveChangesAsync();
        }

        public async Task ReviewAsync(Guid userId, ReviewBookDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);
            book.Review = request.Review;
            await _db.SaveChangesAsync();
        }

        // --- Helper ---
        private async Task<UserBook> GetUserBook(Guid userId, string googleBookId)
        {
            return await _db.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId)
                ?? throw new KeyNotFoundException("Kitap kütüphanede bulunamadı.");
        }
    }
}
