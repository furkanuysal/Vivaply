using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;

namespace Vivaply.API.Services.Account.Images
{
    public class ImageService : IImageService
    {
        private readonly IWebHostEnvironment _env;

        public ImageService(IWebHostEnvironment env)
        {
            _env = env;
        }

        public async Task<string> SaveImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0)
                throw new InvalidOperationException("File is empty.");

            // File size limit
            const long maxFileSize = 2 * 1024 * 1024;
            if (file.Length > maxFileSize)
                throw new InvalidOperationException("File size is too large.");

            // File extension whitelist
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (!allowedExtensions.Contains(extension))
                throw new InvalidOperationException("Invalid file extension.");

            // Content validation (is it really an image?)
            await using (var validationStream = file.OpenReadStream())
            {
                var imageFormat = Image.DetectFormat(validationStream)
                    ?? throw new InvalidOperationException("File is not an image.");

                if (imageFormat is not JpegFormat &&
                    imageFormat is not PngFormat &&
                    imageFormat.Name != "WEBP")
                {
                    throw new InvalidOperationException("Unsupported image format.");
                }
            }

            // Folder control
            var uploadsFolder = Path.Combine(
                _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                "uploads",
                "avatars"
            );

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Secure file name (GUID, no hyphens)
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            // Write file to disk (no overwrite)
            await using (var fileStream = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true))
            {
                await file.CopyToAsync(fileStream);
            }

            // Public URL
            return $"/uploads/avatars/{uniqueFileName}";
        }


        public async Task<string> SaveOrReplaceImageAsync(IFormFile file, string? oldImagePath)
        {
            // Save new image
            var newImagePath = await SaveImageAsync(file);

            // Delete old image
            if (!string.IsNullOrWhiteSpace(oldImagePath))
            {
                DeleteImage(oldImagePath);
            }

            return newImagePath;
        }


        public void DeleteImage(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            // Allow deletion only from the avatars folder
            if (!relativePath.StartsWith("/uploads/avatars/"))
                return;

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");

            var fullPath = Path.Combine(
                rootPath,
                relativePath.TrimStart('/')
            );

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

    }
}
