using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Knowledge;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Knowledge.DTOs.Commands.Book;
using Vivaply.API.Modules.Core.Knowledge.DTOs.GoogleBooks;
using Vivaply.API.Modules.Core.Knowledge.Enums;
using Vivaply.API.Modules.Core.Knowledge.Services.Interfaces;
using Vivaply.API.Modules.Core.Ratings.Enums;
using Vivaply.API.Modules.Core.Ratings.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.Events;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Knowledge.Services.Implementations
{
    public class BookService(
        VivaplyDbContext db,
        IGoogleBooksService googleBooks,
        IApplicationEventPublisher eventPublisher,
        IActivityCleanupService activityCleanupService,
        IPostCleanupService postCleanupService,
        IContentRatingService contentRatingService) : IBookService
    {
        private readonly VivaplyDbContext _db = db;
        private readonly IGoogleBooksService _googleBooks = googleBooks;
        private readonly IApplicationEventPublisher _eventPublisher = eventPublisher;
        private readonly IActivityCleanupService _activityCleanupService = activityCleanupService;
        private readonly IPostCleanupService _postCleanupService = postCleanupService;
        private readonly IContentRatingService _contentRatingService = contentRatingService;

        public Task<List<BookContentDto>> SearchAsync(string query)
            => _googleBooks.SearchBooksAsync(query);

        public async Task<List<BookContentDto>> DiscoverAsync(string lang)
        {
            var subjects = new[]
            {
                "fiction",
                "fantasy",
                "mystery",
                "thriller",
                "romance",
                "biography",
                "self-help"
            };

            var random = new Random();
            var subject = subjects[random.Next(subjects.Length)];
            var startIndex = random.Next(0, 200);

            return await _googleBooks.SearchBooksAsync(
                $"subject:{subject}&orderBy=relevance",
                lang,
                startIndex
            );
        }

        public async Task<BookContentDto?> GetDetailAsync(Guid userId, string googleBookId)
        {
            var book = await _googleBooks.GetBookDetailsAsync(googleBookId);
            if (book == null) return null;

            var stats = await _contentRatingService.GetStatsAsync(
                ContentSourceType.Book,
                googleBookId);
            book.VivaRating = stats?.AverageRating;
            book.VivaRatingCount = stats?.RatingCount ?? 0;

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
                Title = b.Metadata?.Title ?? "(Unknown)",
                Authors = JsonHelper.DeserializeList<string>(b.Metadata?.AuthorsJson),
                CoverUrl = b.Metadata?.CoverUrl,
                PageCount = b.Metadata?.PageCount ?? 0,
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

            var metadata = await GetOrCreateBookMetadataAsync(
                request.GoogleBookId,
                request.Title,
                request.Authors,
                request.CoverUrl,
                request.PageCount
            );

            var book = new UserBook
            {
                UserId = userId,
                GoogleBookId = request.GoogleBookId,
                Status = request.Status,
                DateAdded = DateTime.UtcNow,
                DateFinished = request.Status == ReadStatus.Completed ? DateTime.UtcNow : null
            };

            _db.UserBooks.Add(book);

            await _db.SaveChangesAsync();

            if (request.Status == ReadStatus.Reading)
            {
                await _eventPublisher.PublishAsync(new BookStartedEvent(
                    userId,
                    request.GoogleBookId,
                    metadata.Title,
                    metadata.CoverUrl,
                    book.DateAdded,
                    book.Id.ToString(),
                    GetBookAuthors(book.Metadata)
                ));
            }
            else
            {
                await _eventPublisher.PublishAsync(new LibraryItemAddedEvent(
                    userId,
                    "book",
                    request.GoogleBookId,
                    metadata.Title,
                    metadata.CoverUrl,
                    "UserBook",
                    book.Id.ToString(),
                    Authors: GetBookAuthors(book.Metadata)
                ));
            }
        }

        public async Task RemoveAsync(Guid userId, string googleBookId)
        {
            var book = await _db.UserBooks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId);

            if (book == null)
                throw new KeyNotFoundException("Book couldn't be found.");

            _db.UserBooks.Remove(book);
            await _db.SaveChangesAsync();
            await _activityCleanupService.HideActivitiesForBookAsync(userId, googleBookId);
            await _postCleanupService.HidePostsForBookAsync(userId, googleBookId);
        }

        public async Task UpdateStatusAsync(Guid userId, UpdateBookStatusDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);
            var wasCompleted = book.Status == ReadStatus.Completed;

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

            if (!wasCompleted && request.Status == ReadStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new BookFinishedEvent(
                    userId,
                    request.GoogleBookId,
                    book.Metadata?.Title ?? "Unknown",
                    book.Metadata?.CoverUrl,
                    book.DateFinished ?? DateTime.UtcNow,
                    book.Id.ToString(),
                    GetBookAuthors(book.Metadata)
                ));
            }
        }

        public async Task UpdateProgressAsync(Guid userId, UpdateBookProgressDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);
            var wasCompleted = book.Status == ReadStatus.Completed;
            var pageCount = book.Metadata?.PageCount ?? 0;

            book.CurrentPage = Math.Min(request.CurrentPage, pageCount);

            if (book.CurrentPage == pageCount && pageCount > 0)
            {
                book.Status = ReadStatus.Completed;
                if (book.DateFinished == null)
                    book.DateFinished = DateTime.UtcNow;
            }
            else if (book.Status == ReadStatus.Completed)
            {
                book.Status = ReadStatus.Reading;
                book.DateFinished = null;
            }

            await _db.SaveChangesAsync();

            if (!wasCompleted && book.Status == ReadStatus.Completed)
            {
                await _eventPublisher.PublishAsync(new BookFinishedEvent(
                    userId,
                    request.GoogleBookId,
                    book.Metadata?.Title ?? "Unknown",
                    book.Metadata?.CoverUrl,
                    book.DateFinished ?? DateTime.UtcNow,
                    book.Id.ToString(),
                    GetBookAuthors(book.Metadata)
                ));
            }
        }

        public async Task RateAsync(Guid userId, RateBookDto request)
        {
            if (request.Rating < 0 || request.Rating > 10)
                throw new ArgumentOutOfRangeException(nameof(request.Rating));

            var book = await _db.UserBooks
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == request.GoogleBookId);

            if (book == null)
            {
                var details = await _googleBooks.GetBookDetailsAsync(request.GoogleBookId)
                    ?? throw new KeyNotFoundException("Book couldn't be found.");

                var metadata = await GetOrCreateBookMetadataAsync(
                    request.GoogleBookId,
                    details.Title,
                    details.Authors,
                    details.CoverUrl,
                    details.PageCount
                );

                book = new UserBook
                {
                    UserId = userId,
                    GoogleBookId = request.GoogleBookId,
                    Status = ReadStatus.Reading,
                    DateAdded = DateTime.UtcNow,
                    Metadata = metadata
                };

                _db.UserBooks.Add(book);
            }

            book.UserRating = request.Rating;

            await _db.SaveChangesAsync();
            await _contentRatingService.SetRatingAsync(
                userId,
                ContentSourceType.Book,
                request.GoogleBookId,
                request.Rating);

            await _eventPublisher.PublishAsync(new BookRatedEvent(
                userId,
                request.GoogleBookId,
                book.Metadata?.Title ?? "Unknown",
                book.Metadata?.CoverUrl,
                request.Rating,
                book.Id.ToString(),
                GetBookAuthors(book.Metadata)
            ));
        }

        public async Task ReviewAsync(Guid userId, ReviewBookDto request)
        {
            var book = await GetUserBook(userId, request.GoogleBookId);
            book.Review = request.Review;
            await _db.SaveChangesAsync();

            await _eventPublisher.PublishAsync(new BookReviewAddedEvent(
                userId,
                request.GoogleBookId,
                book.Metadata?.Title ?? "Unknown",
                book.Metadata?.CoverUrl,
                request.Review,
                book.UserRating,
                book.Id.ToString(),
                GetBookAuthors(book.Metadata)
            ));
        }

        private static List<string>? GetBookAuthors(BookMetadata? metadata)
        {
            if (metadata == null)
                return null;

            var authors = JsonHelper.DeserializeList<string>(metadata.AuthorsJson)?
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => x.Trim())
                .Take(2)
                .ToList() ?? [];

            return authors.Count > 0 ? authors : null;
        }

        private async Task<UserBook> GetUserBook(Guid userId, string googleBookId)
        {
            return await _db.UserBooks
                .Include(x => x.Metadata)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.GoogleBookId == googleBookId)
                ?? throw new KeyNotFoundException("Book couldn't be found on library.");
        }

        private async Task<BookMetadata> GetOrCreateBookMetadataAsync(
            string googleBookId,
            string? title,
            List<string>? authors,
            string? coverUrl,
            int? pageCount)
        {
            var metadata = await _db.BookMetadata
                .FirstOrDefaultAsync(x => x.GoogleBookId == googleBookId);

            if (metadata != null)
                return metadata;

            metadata = new BookMetadata
            {
                GoogleBookId = googleBookId,
                Title = title ?? "(Unknown)",
                AuthorsJson = JsonHelper.SerializeList(authors ?? []),
                CoverUrl = coverUrl,
                PageCount = pageCount ?? 0,
                LastFetchedAt = DateTime.UtcNow
            };

            _db.BookMetadata.Add(metadata);

            try
            {
                await _db.SaveChangesAsync();
                return metadata;
            }
            catch (DbUpdateException)
            {
                return await _db.BookMetadata
                    .FirstAsync(x => x.GoogleBookId == googleBookId);
            }
        }
    }
}
