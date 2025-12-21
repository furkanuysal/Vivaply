using Vivaply.API.DTOs.Knowledge.Commands.Book;
using Vivaply.API.DTOs.Knowledge.GoogleBooks;

namespace Vivaply.API.Services.Knowledge.Book
{
    public interface IBookService
    {
        // Discovery
        Task<List<BookContentDto>> SearchAsync(string query);
        Task<BookContentDto?> GetDetailAsync(Guid userId, string googleBookId);

        // Library
        Task<List<BookContentDto>> GetLibraryAsync(Guid userId);
        Task TrackAsync(Guid userId, AddBookDto request);
        Task RemoveAsync(Guid userId, string googleBookId);

        // Progress / Status
        Task UpdateStatusAsync(Guid userId, UpdateBookStatusDto request);
        Task UpdateProgressAsync(Guid userId, UpdateBookProgressDto request);

        // Rating / Review
        Task RateAsync(Guid userId, RateBookDto request);
        Task ReviewAsync(Guid userId, ReviewBookDto request);
    }
}
