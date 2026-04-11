using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Controllers
{
    [ApiController]
    [Route("/api/users")]
    public class FollowController(IFollowService followService) : BaseApiController
    {
        private readonly IFollowService _followService = followService;

        // FOLLOW
        [HttpPost("{targetUserId}/follow")]
        public async Task<IActionResult> Follow(Guid targetUserId)
        {
            await _followService.FollowAsync(CurrentUserId, targetUserId);
            return Ok();
        }

        // UNFOLLOW
        [HttpDelete("{targetUserId}/follow")]
        public async Task<IActionResult> Unfollow(Guid targetUserId)
        {
            await _followService.UnfollowAsync(CurrentUserId, targetUserId);
            return NoContent();
        }

        // ACCEPT REQUEST
        [HttpPut("{requesterId}/follow/accept")]
        public async Task<IActionResult> Accept(Guid requesterId)
        {
            await _followService.AcceptRequestAsync(CurrentUserId, requesterId);
            return Ok();
        }

        // REJECT REQUEST
        [HttpPut("{requesterId}/follow/reject")]
        public async Task<IActionResult> Reject(Guid requesterId)
        {
            await _followService.RejectRequestAsync(CurrentUserId, requesterId);
            return Ok();
        }

        // GET FOLLOWERS
        [HttpGet("{userId}/followers")]
        public async Task<IActionResult> GetFollowers(Guid userId)
        {
            var result = await _followService.GetFollowersAsync(CurrentUserId, userId);
            return Ok(result);
        }

        // GET FOLLOWING
        [HttpGet("{userId}/following")]
        public async Task<IActionResult> GetFollowing(Guid userId)
        {
            var result = await _followService.GetFollowingAsync(CurrentUserId, userId);
            return Ok(result);
        }

        // GET PENDING REQUESTS (for current user)
        [HttpGet("me/follow-requests")]
        public async Task<IActionResult> GetPending()
        {
            var result = await _followService.GetPendingRequestsAsync(CurrentUserId);
            return Ok(result);
        }

        // GET RELATION STATUS
        [HttpGet("{targetUserId}/follow/status")]
        public async Task<IActionResult> GetStatus(Guid targetUserId)
        {
            var result = await _followService.GetRelationStatusAsync(CurrentUserId, targetUserId);
            return Ok(result);
        }
    }
}
