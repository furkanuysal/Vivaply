namespace Vivaply.API.Modules.Core.Identity.Services.Interfaces
{
    public interface IImageService
    {
        Task<string> SaveImageAsync(IFormFile file);
        Task<string> SaveImageAsync(IFormFile file, string folderName, long maxFileSizeBytes);
        Task<string> SaveOrReplaceImageAsync(
        IFormFile file,
        string? oldImagePath
    );
        void DeleteImage(string relativePath);
    }
}
