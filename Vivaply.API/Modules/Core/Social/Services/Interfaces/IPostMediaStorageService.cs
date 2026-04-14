using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IPostMediaStorageService
    {
        Task<List<PostAttachment>> SaveAsync(
            IEnumerable<IFormFile>? files,
            IEnumerable<IFormFile>? thumbnailFiles,
            IEnumerable<int>? thumbnailIndexes,
            CancellationToken cancellationToken = default);
        void Delete(string? relativePath);
    }
}
