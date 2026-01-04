namespace Vivaply.API.Services.Account.Images
{
    public interface IImageService
    {
        Task<string> SaveImageAsync(IFormFile file);
        Task<string> SaveOrReplaceImageAsync(
        IFormFile file,
        string? oldImagePath
    );
        void DeleteImage(string relativePath);
    }
}
