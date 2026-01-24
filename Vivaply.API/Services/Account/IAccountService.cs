using Vivaply.API.DTOs.Account;

namespace Vivaply.API.Services.Account
{
    public interface IAccountService
    {
        Task<UserProfileDto> GetProfileAsync(Guid userId);
        Task UpdateProfileAsync(Guid userId, UpdateProfileDto request);
        Task<string> UploadAvatarAsync(Guid userId, UploadAvatarDto request);
        Task ChangePasswordAsync(Guid userId, ChangePasswordDto request);
        Task DeleteAccountAsync(Guid userId);
    }
}
