using Vivaply.API.Modules.Core.Identity.DTOs.Account;

namespace Vivaply.API.Modules.Core.Identity.Services.Interfaces
{
    public interface IAccountService
    {
        Task<UserProfileDto> GetProfileAsync(Guid userId);
        Task<UserProfileDto> GetProfileByUsernameAsync(Guid currentUserId, string username);
        Task UpdateProfileAsync(Guid userId, UpdateProfileDto request);
        Task<string> UploadAvatarAsync(Guid userId, UploadAvatarDto request);
        Task ChangePasswordAsync(Guid userId, ChangePasswordDto request);
        Task DeleteAccountAsync(Guid userId);
    }
}
