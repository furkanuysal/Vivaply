using Vivaply.API.Modules.Core.Knowledge.DTOs.GoogleBooks;

namespace Vivaply.API.Modules.Core.Knowledge.Services.Interfaces
{
    public interface IGoogleBooksService
    {
        Task<List<BookContentDto>> SearchBooksAsync(
            string query,
            string? lang = null,
            int startIndex = 0
        );

        Task<BookContentDto?> GetBookDetailsAsync(string googleBookId);
    }
}
