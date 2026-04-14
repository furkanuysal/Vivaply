using Microsoft.Extensions.Caching.Memory;
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
using Vivaply.API.Modules.Core.Statistics.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.Events;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Knowledge.Services.Implementations
{
    public class BookService(
        VivaplyDbContext db,
        IMemoryCache cache,
        IGoogleBooksService googleBooks,
        IApplicationEventPublisher eventPublisher,
        IActivityCleanupService activityCleanupService,
        IPostCleanupService postCleanupService,
        IContentRatingService contentRatingService,
        IContentEngagementStatsService contentEngagementStatsService) : IBookService
    {
        private static readonly TimeSpan DiscoverCacheDuration = TimeSpan.FromMinutes(20);
        private static readonly TimeSpan DiscoverCacheSlidingDuration = TimeSpan.FromMinutes(5);
        private readonly VivaplyDbContext _db = db;
        private readonly IMemoryCache _cache = cache;
        private readonly IGoogleBooksService _googleBooks = googleBooks;
        private readonly IApplicationEventPublisher _eventPublisher = eventPublisher;
        private readonly IActivityCleanupService _activityCleanupService = activityCleanupService;
        private readonly IPostCleanupService _postCleanupService = postCleanupService;
        private readonly IContentRatingService _contentRatingService = contentRatingService;
        private readonly IContentEngagementStatsService _contentEngagementStatsService = contentEngagementStatsService;

        public Task<List<BookContentDto>> SearchAsync(string query)
            => _googleBooks.SearchBooksAsync(query);

        public async Task<List<BookContentDto>> DiscoverAsync(string lang)
        {
            var cacheKey = $"knowledge:discover:{lang}".ToLowerInvariant();
            if (_cache.TryGetValue(cacheKey, out List<BookContentDto>? cachedResults) &&
                cachedResults is { Count: > 0 })
            {
                return cachedResults;
            }

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
            var subjectPool = subjects
                .OrderBy(_ => random.Next())
                .Take(4)
                .ToList();

            foreach (var subject in subjectPool)
            {
                for (var attempt = 0; attempt < 3; attempt++)
                {
                    var startIndex = attempt == 0 ? 0 : random.Next(0, 160);
                    var results = await _googleBooks.SearchBooksAsync(
                        $"subject:{subject}&orderBy=relevance",
                        lang,
                        startIndex
                    );

                    if (results.Count > 0)
                    {
                        CacheDiscoverResults(cacheKey, results);
                        return results;
                    }
                }
            }

            var fallbackResults = await _googleBooks.SearchBooksAsync(
                "bestseller",
                lang,
                0
            );

            if (fallbackResults.Count > 0)
            {
                CacheDiscoverResults(cacheKey, fallbackResults);
            }

            return fallbackResults;
        }

        public async Task<BookContentDto?> GetDetailAsync(Guid userId, string googleBookId)
        {
            var book = await _googleBooks.GetBookDetailsAsync(googleBookId);
            if (book == null) return null;

            await UpsertBookMetadataFromContentAsync(book);

            var stats = await _contentRatingService.GetStatsAsync(
                ContentSourceType.Book,
                googleBookId);
            var engagementStats = await _contentEngagementStatsService.GetStatsAsync(
                ContentSourceType.Book,
                googleBookId);
            book.VivaRating = stats?.AverageRating;
            book.VivaRatingCount = stats?.RatingCount ?? 0;
            book.ListCount = engagementStats?.ListCount ?? 0;
            book.ActiveCount = engagementStats?.ActiveCount ?? 0;
            book.CompletedCount = engagementStats?.CompletedCount ?? 0;
            book.CompletionRate = engagementStats?.CompletionRate ?? 0;

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
                AverageRating = b.Metadata?.VoteAverage ?? 0,
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

            var details = await _googleBooks.GetBookDetailsAsync(request.GoogleBookId);

            var metadata = await GetOrCreateBookMetadataAsync(
                request.GoogleBookId,
                details?.Title ?? request.Title,
                details?.Authors ?? request.Authors,
                details?.CoverUrl ?? request.CoverUrl,
                details?.PageCount ?? request.PageCount,
                details?.AverageRating ?? 0
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
            await SyncBookEngagementStatsAsync(request.GoogleBookId);

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
            await SyncBookEngagementStatsAsync(googleBookId);
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
            await SyncBookEngagementStatsAsync(request.GoogleBookId);

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
            await SyncBookEngagementStatsAsync(request.GoogleBookId);

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
                    details.PageCount,
                    details.AverageRating
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
            await SyncBookEngagementStatsAsync(request.GoogleBookId);
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

        private Task SyncBookEngagementStatsAsync(string googleBookId)
        {
            return _contentEngagementStatsService.RebuildAsync(
                ContentSourceType.Book,
                googleBookId);
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

        private void CacheDiscoverResults(string cacheKey, List<BookContentDto> results)
        {
            _cache.Set(
                cacheKey,
                results,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = DiscoverCacheDuration,
                    SlidingExpiration = DiscoverCacheSlidingDuration
                });
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
            int? pageCount,
            double? averageRating)
        {
            var metadata = await _db.BookMetadata
                .FirstOrDefaultAsync(x => x.GoogleBookId == googleBookId);

            if (metadata != null)
            {
                var hasChanges = false;

                if (!string.IsNullOrWhiteSpace(title) && metadata.Title != title)
                {
                    metadata.Title = title;
                    hasChanges = true;
                }

                var authorsJson = JsonHelper.SerializeList(authors ?? []);
                if (metadata.AuthorsJson != authorsJson)
                {
                    metadata.AuthorsJson = authorsJson;
                    hasChanges = true;
                }

                if (!string.IsNullOrWhiteSpace(coverUrl) && metadata.CoverUrl != coverUrl)
                {
                    metadata.CoverUrl = coverUrl;
                    hasChanges = true;
                }

                if (pageCount.HasValue && pageCount.Value > 0 && metadata.PageCount != pageCount.Value)
                {
                    metadata.PageCount = pageCount.Value;
                    hasChanges = true;
                }

                var normalizedAverageRating = NormalizeStoredAverageRating(averageRating);
                if (metadata.VoteAverage != normalizedAverageRating)
                {
                    metadata.VoteAverage = normalizedAverageRating;
                    hasChanges = true;
                }

                if (hasChanges)
                {
                    metadata.LastFetchedAt = DateTime.UtcNow;
                    await _db.SaveChangesAsync();
                }

                return metadata;
            }

            metadata = new BookMetadata
            {
                GoogleBookId = googleBookId,
                Title = title ?? "(Unknown)",
                AuthorsJson = JsonHelper.SerializeList(authors ?? []),
                CoverUrl = coverUrl,
                PageCount = pageCount ?? 0,
                VoteAverage = NormalizeStoredAverageRating(averageRating),
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

        private Task<BookMetadata> UpsertBookMetadataFromContentAsync(BookContentDto book)
        {
            return GetOrCreateBookMetadataAsync(
                book.Id,
                book.Title,
                book.Authors,
                book.CoverUrl,
                book.PageCount,
                book.AverageRating);
        }

        private static double NormalizeStoredAverageRating(double? averageRating)
        {
            if (!averageRating.HasValue || averageRating.Value <= 0)
                return 0;

            return Math.Round(Math.Clamp(averageRating.Value, 0, 10), 1);
        }
    }
}
