using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Controllers
{
    [ApiController]
    [Route("/api/users")]
    public class UserModerationController(IUserModerationService userModerationService) : BaseApiController
    {
        private readonly IUserModerationService _userModerationService = userModerationService;

        [HttpPost("{targetUserId}/block")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Block(Guid targetUserId, CancellationToken cancellationToken)
        {
            await _userModerationService.BlockAsync(CurrentUserId, targetUserId, cancellationToken);
            return Ok();
        }

        [HttpDelete("{targetUserId}/block")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Unblock(Guid targetUserId, CancellationToken cancellationToken)
        {
            await _userModerationService.UnblockAsync(CurrentUserId, targetUserId, cancellationToken);
            return NoContent();
        }

        [HttpPost("{targetUserId}/mute")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Mute(Guid targetUserId, CancellationToken cancellationToken)
        {
            await _userModerationService.MuteAsync(CurrentUserId, targetUserId, cancellationToken);
            return Ok();
        }

        [HttpDelete("{targetUserId}/mute")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Unmute(Guid targetUserId, CancellationToken cancellationToken)
        {
            await _userModerationService.UnmuteAsync(CurrentUserId, targetUserId, cancellationToken);
            return NoContent();
        }
    }
}
