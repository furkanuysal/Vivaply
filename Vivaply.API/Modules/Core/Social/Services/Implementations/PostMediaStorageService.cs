using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Jpeg;
using SixLabors.ImageSharp.Formats.Png;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Social.Enums;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class PostMediaStorageService(IWebHostEnvironment env) : IPostMediaStorageService
    {
        private const long MaxImageSizeBytes = 10 * 1024 * 1024;
        private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        private readonly IWebHostEnvironment _env = env;

        public async Task<List<PostAttachment>> SaveAsync(IEnumerable<IFormFile>? files, CancellationToken cancellationToken = default)
        {
            if (files == null)
            {
                return [];
            }

            var validFiles = files
                .Where(file => file is { Length: > 0 })
                .Take(4)
                .ToList();

            if (validFiles.Count == 0)
            {
                return [];
            }

            var attachments = new List<PostAttachment>(validFiles.Count);

            for (var index = 0; index < validFiles.Count; index++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                var file = validFiles[index];
                var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
                var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;

                if (IsImageFile(extension, contentType))
                {
                    attachments.Add(await SaveImageAsync(file, index, cancellationToken));
                    continue;
                }

                throw new InvalidOperationException("Only image uploads are supported for posts right now.");
            }

            return attachments;
        }

        private static bool IsImageFile(string extension, string contentType)
        {
            return AllowedImageExtensions.Contains(extension) || contentType.StartsWith("image/");
        }

        public void Delete(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath) || !relativePath.StartsWith("/uploads/posts/"))
            {
                return;
            }

            var rootPath = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            var fullPath = Path.Combine(rootPath, relativePath.TrimStart('/'));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        private async Task<PostAttachment> SaveImageAsync(IFormFile file, int sortOrder, CancellationToken cancellationToken)
        {
            var relativePath = await SaveImageFileAsync(file, cancellationToken);

            return new PostAttachment
            {
                Type = PostAttachmentType.Image,
                Url = relativePath,
                SortOrder = sortOrder
            };
        }

        private async Task<string> SaveImageFileAsync(IFormFile file, CancellationToken cancellationToken)
        {
            if (file.Length > MaxImageSizeBytes)
            {
                throw new InvalidOperationException("Image file size is too large.");
            }

            await using (var validationStream = file.OpenReadStream())
            {
                var imageFormat = Image.DetectFormat(validationStream)
                    ?? throw new InvalidOperationException("File is not a valid image.");

                if (imageFormat is not JpegFormat &&
                    imageFormat is not PngFormat &&
                    imageFormat.Name != "WEBP")
                {
                    throw new InvalidOperationException("Unsupported image format.");
                }
            }

            return await SaveFileAsync(file, cancellationToken);
        }

        private async Task<string> SaveFileAsync(IFormFile file, CancellationToken cancellationToken)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uploadsFolder = Path.Combine(
                _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                "uploads",
                "posts");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);

            await using var fileStream = new FileStream(
                filePath,
                FileMode.CreateNew,
                FileAccess.Write,
                FileShare.None,
                bufferSize: 81920,
                useAsync: true);

            await file.CopyToAsync(fileStream, cancellationToken);

            return $"/uploads/posts/{uniqueFileName}";
        }
    }
}
