using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IPostMediaStorageService
    {
        Task<List<PostAttachment>> SaveAsync(IEnumerable<IFormFile>? files, CancellationToken cancellationToken = default);
        void Delete(string? relativePath);
    }
}
