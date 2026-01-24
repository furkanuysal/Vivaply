using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Vivaply.API.DTOs.Account;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Services.Account;

namespace Vivaply.API.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController : ControllerBase
    {
        private readonly IAccountService _accountService;

        public AccountController(IAccountService accountService)
        {
            _accountService = accountService;
        }

        [HttpGet] // URL: /api/Account
        public async Task<IActionResult> GetMyProfile()
        {
            var profile = await _accountService.GetProfileAsync(GetUserId());
            return Ok(profile);
        }

        // Update Profile
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            await _accountService.UpdateProfileAsync(GetUserId(), request);
            return Ok(new { message = "Profile updated successfully." });
        }

        // Upload Avatar
        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarDto request)
        {
            var avatarUrl = await _accountService.UploadAvatarAsync(GetUserId(), request);
            return Ok(new { message = "Avatar uploaded successfully.", avatarUrl });
        }

        // Change Password
        [HttpPut("password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            await _accountService.ChangePasswordAsync(GetUserId(), request);
            return Ok(new { message = "Password changed successfully." });
        }

        // Delete Account
        [HttpDelete]
        public async Task<IActionResult> DeleteAccount()
        {
            await _accountService.DeleteAccountAsync(GetUserId());
            return Ok(new { message = "Account deleted successfully." });
        }

        // Helper: Get User ID from Token
        private Guid GetUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var userId))
                throw new UnauthorizedAccessException();
            return userId;
        }
    }
}
