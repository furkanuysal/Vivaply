using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Identity.DTOs.Account;
using Vivaply.API.Modules.Core.Identity.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Identity.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class AccountController(IAccountService accountService) : BaseApiController
    {
        private readonly IAccountService _accountService = accountService;

        [HttpGet]
        public async Task<IActionResult> GetMyProfile()
        {
            var profile = await _accountService.GetProfileAsync(CurrentUserId);
            return Ok(profile);
        }

        [HttpGet("/api/users/{username}")]
        public async Task<IActionResult> GetProfileByUsername(string username)
        {
            try
            {
                var profile = await _accountService.GetProfileByUsernameAsync(CurrentUserId, username);
                return Ok(profile);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpPut("profile")]
        [EnableRateLimiting(RateLimitPolicies.AccountWrite)]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto request)
        {
            try
            {
                await _accountService.UpdateProfileAsync(CurrentUserId, request);
                return Ok(new { message = "Profile updated successfully." });
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(new { message = ex.Message });
            }
        }

        [HttpPut("preferences")]
        [EnableRateLimiting(RateLimitPolicies.AccountWrite)]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdatePreferencesDto request)
        {
            await _accountService.UpdatePreferencesAsync(CurrentUserId, request);
            return Ok(new { message = "Preferences updated successfully." });
        }

        [HttpPost("avatar")]
        [EnableRateLimiting(RateLimitPolicies.AccountWrite)]
        public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarDto request)
        {
            var avatarUrl = await _accountService.UploadAvatarAsync(CurrentUserId, request);
            return Ok(new { message = "Avatar uploaded successfully.", avatarUrl });
        }

        [HttpPut("password")]
        [EnableRateLimiting(RateLimitPolicies.AccountWrite)]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto request)
        {
            await _accountService.ChangePasswordAsync(CurrentUserId, request);
            return Ok(new { message = "Password changed successfully." });
        }

        [HttpDelete]
        [EnableRateLimiting(RateLimitPolicies.AccountWrite)]
        public async Task<IActionResult> DeleteAccount()
        {
            await _accountService.DeleteAccountAsync(CurrentUserId);
            return Ok(new { message = "Account deleted successfully." });
        }
    }
}
