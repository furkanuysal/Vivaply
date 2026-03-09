using Vivaply.API.DTOs.Knowledge.GoogleBooks;

namespace Vivaply.API.Services.Knowledge.GoogleBooks
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
