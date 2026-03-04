using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Knowledge.Commands.Book;
using Vivaply.API.DTOs.Knowledge.GoogleBooks;
using Vivaply.API.Entities.Knowledge;
using Vivaply.API.Services.Infrastructure.Serialization;
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
                .AsNoTracking()
                .Include(x => x.Metadata)
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.DateAdded)
                .ToListAsync();

            return books.Select(b => new BookContentDto
            {
                Id = b.GoogleBookId,

                // Metadata
                Title = b.Metadata?.Title ?? "(Unknown)",
                Authors = JsonHelper.DeserializeList<string>(b.Metadata?.AuthorsJson),
                CoverUrl = b.Metadata?.CoverUrl,
                PageCount = b.Metadata?.PageCount ?? 0,

                // User-specific
                UserStatus = b.Status,
                CurrentPage = b.CurrentPage,
                UserRating = b.UserRating,
                UserReview = b.Review
            }).ToList();
        }


        public async Task TrackAsync(Guid userId, AddBookDto request)
        {
            if (await _db.UserBooks.AnyAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId))
                throw new InvalidOperationException("This book is already on library.");

            // Check if metadata exists, if not create a new one (to avoid unnecessary API calls in the future)
            var metadata = await _db.BookMetadata
                .FirstOrDefaultAsync(x => x.GoogleBookId == request.GoogleBookId);

            if (metadata == null)
            {
                metadata = new BookMetadata
                {
                    GoogleBookId = request.GoogleBookId,
                    Title = request.Title,
                    AuthorsJson = JsonHelper.SerializeList(request.Authors),
                    CoverUrl = request.CoverUrl,
                    PageCount = request.PageCount,
                    LastFetchedAt = DateTime.UtcNow
                };

                _db.BookMetadata.Add(metadata);
            }

            _db.UserBooks.Add(new UserBook
            {
                UserId = userId,
                GoogleBookId = request.GoogleBookId,
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
                throw new KeyNotFoundException("Book couldn't be found.");

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
                book.CurrentPage = book.Metadata?.PageCount ?? book.CurrentPage;

                if (book.DateFinished == null)
                    book.DateFinished = DateTime.UtcNow;
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

            var pageCount = book.Metadata?.PageCount ?? 0;

            book.CurrentPage = Math.Min(request.CurrentPage, pageCount);

            if (book.CurrentPage == pageCount && pageCount > 0)
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
                    ?? throw new KeyNotFoundException("Book couldn't be found.");

                var metadata = await _db.BookMetadata
                    .FirstOrDefaultAsync(x => x.GoogleBookId == request.GoogleBookId);

                if (metadata == null)
                {
                    metadata = new BookMetadata
                    {
                        GoogleBookId = request.GoogleBookId,
                        Title = details.Title,
                        AuthorsJson = JsonHelper.SerializeList(details.Authors),
                        CoverUrl = details.CoverUrl,
                        PageCount = details.PageCount,
                        LastFetchedAt = DateTime.UtcNow
                    };

                    _db.BookMetadata.Add(metadata);
                }

                book = new UserBook
                {
                    UserId = userId,
                    GoogleBookId = request.GoogleBookId,
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
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId)
                ?? throw new KeyNotFoundException("Book couldn't be found on library.");
        }
    }
}
