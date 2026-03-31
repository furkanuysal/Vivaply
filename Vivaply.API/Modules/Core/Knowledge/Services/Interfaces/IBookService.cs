using Vivaply.API.Modules.Core.Knowledge.DTOs.Commands.Book;
using Vivaply.API.Modules.Core.Knowledge.DTOs.GoogleBooks;

namespace Vivaply.API.Modules.Core.Knowledge.Services.Interfaces
{
    public interface IBookService
    {
        // Discovery
        Task<List<BookContentDto>> SearchAsync(string query);
        Task<List<BookContentDto>> DiscoverAsync(string lang);
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
