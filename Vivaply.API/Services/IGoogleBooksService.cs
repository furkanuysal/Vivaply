using Vivaply.API.DTOs.GoogleBooks;

namespace Vivaply.API.Services
{
    public interface IGoogleBooksService
    {
        Task<List<BookContentDto>> SearchBooksAsync(string query, string lang = "en");
        Task<BookContentDto?> GetBookDetailsAsync(string googleBookId);
    }
}
