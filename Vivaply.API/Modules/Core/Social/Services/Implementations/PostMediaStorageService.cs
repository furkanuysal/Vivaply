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
        private const long MaxVideoSizeBytes = 100 * 1024 * 1024;
        private static readonly string[] AllowedImageExtensions = [".jpg", ".jpeg", ".png", ".webp"];
        private static readonly string[] AllowedVideoExtensions = [".mp4", ".webm", ".mov", ".m4v", ".ogv", ".ogg"];
        private readonly IWebHostEnvironment _env = env;

        public async Task<List<PostAttachment>> SaveAsync(
            IEnumerable<IFormFile>? files,
            IEnumerable<IFormFile>? thumbnailFiles,
            IEnumerable<int>? thumbnailIndexes,
            CancellationToken cancellationToken = default)
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

            var thumbnailLookup = BuildThumbnailLookup(thumbnailFiles, thumbnailIndexes);
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

                if (IsVideoFile(extension, contentType))
                {
                    thumbnailLookup.TryGetValue(index, out var thumbnailFile);
                    attachments.Add(await SaveVideoAsync(file, thumbnailFile, index, extension, cancellationToken));
                    continue;
                }

                throw new InvalidOperationException("Unsupported media format.");
            }

            return attachments;
        }

        private static Dictionary<int, IFormFile> BuildThumbnailLookup(
            IEnumerable<IFormFile>? thumbnailFiles,
            IEnumerable<int>? thumbnailIndexes)
        {
            if (thumbnailFiles == null || thumbnailIndexes == null)
            {
                return [];
            }

            var files = thumbnailFiles.ToList();
            var indexes = thumbnailIndexes.ToList();

            if (files.Count == 0 || indexes.Count == 0)
            {
                return [];
            }

            var count = Math.Min(files.Count, indexes.Count);
            var lookup = new Dictionary<int, IFormFile>(count);

            for (var i = 0; i < count; i++)
            {
                if (files[i] is { Length: > 0 })
                {
                    lookup[indexes[i]] = files[i];
                }
            }

            return lookup;
        }

        private static bool IsImageFile(string extension, string contentType)
        {
            return AllowedImageExtensions.Contains(extension) || contentType.StartsWith("image/");
        }

        private static bool IsVideoFile(string extension, string contentType)
        {
            return AllowedVideoExtensions.Contains(extension) || contentType.StartsWith("video/");
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

        private async Task<PostAttachment> SaveVideoAsync(
            IFormFile file,
            IFormFile? thumbnailFile,
            int sortOrder,
            string extension,
            CancellationToken cancellationToken)
        {
            if (file.Length > MaxVideoSizeBytes)
            {
                throw new InvalidOperationException("Video file size is too large.");
            }

            var contentType = file.ContentType?.ToLowerInvariant() ?? string.Empty;
            if (!contentType.StartsWith("video/") &&
                !AllowedVideoExtensions.Contains(extension))
            {
                throw new InvalidOperationException("Unsupported video format.");
            }

            var relativePath = await SaveFileAsync(file, cancellationToken);
            var thumbnailRelativePath = thumbnailFile == null
                ? null
                : await SaveImageFileAsync(thumbnailFile, cancellationToken);

            return new PostAttachment
            {
                Type = PostAttachmentType.Video,
                Url = relativePath,
                ThumbnailUrl = thumbnailRelativePath,
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
