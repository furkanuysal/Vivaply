using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.DTOs.Account;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Services.Account;

namespace Vivaply.API.Modules.Core.Identity.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController(IAccountService accountService) : BaseApiController
    {
        private readonly IAccountService _accountService = accountService;

        [HttpGet] // URL: /api/Account
        public async Task<IActionResult> GetMyProfile()
        {
            var profile = await _accountService.GetProfileAsync(CurrentUserId);
            return Ok(profile);
        }

        // Update Profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            try
            {
                await _accountService.UpdateProfileAsync(CurrentUserId, request);
                return Ok(new { message = "Profile updated successfully." });
            }
            catch (InvalidOperationException ex)
            {
                // Service throws "Username already taken" exception
                // Return 409 Conflict
                return Conflict(new { message = ex.Message });
            }
        }

        // Upload Avatar
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarDto request)
        {
            var avatarUrl = await _accountService.UploadAvatarAsync(CurrentUserId, request);
            return Ok(new { message = "Avatar uploaded successfully.", avatarUrl });
        }

        // Change Password
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            await _accountService.ChangePasswordAsync(CurrentUserId, request);
            return Ok(new { message = "Password changed successfully." });
        }

        // Delete Account
        [HttpDelete]
        public async Task<IActionResult> DeleteAccount()
        {
            await _accountService.DeleteAccountAsync(CurrentUserId);
            return Ok(new { message = "Account deleted successfully." });
        }
    }
}
