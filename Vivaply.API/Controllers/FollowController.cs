using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Services.Social.Follow;

namespace Vivaply.API.Controllers
{
    [ApiController]
    [Route("api/follows")]
    public class FollowController : BaseApiController
    {
        private readonly IFollowService _followService;

        public FollowController(IFollowService followService)
        {
            _followService = followService;
        }

        // FOLLOW
        [HttpPost("{targetUserId}")]
        public async Task<IActionResult> Follow(Guid targetUserId)
        {
            await _followService.FollowAsync(CurrentUserId, targetUserId);
            return Ok();
        }

        // UNFOLLOW
        [HttpDelete("{targetUserId}")]
        public async Task<IActionResult> Unfollow(Guid targetUserId)
        {
            await _followService.UnfollowAsync(CurrentUserId, targetUserId);
            return NoContent();
        }

        // ACCEPT REQUEST
        [HttpPost("{requesterId}/accept")]
        public async Task<IActionResult> Accept(Guid requesterId)
        {
            await _followService.AcceptRequestAsync(CurrentUserId, requesterId);
            return Ok();
        }

        // REJECT REQUEST
        [HttpPost("{requesterId}/reject")]
        public async Task<IActionResult> Reject(Guid requesterId)
        {
            await _followService.RejectRequestAsync(CurrentUserId, requesterId);
            return Ok();
        }

        // GET FOLLOWERS
        [HttpGet("{userId}/followers")]
        public async Task<IActionResult> GetFollowers(Guid userId)
        {
            var result = await _followService.GetFollowersAsync(userId);
            return Ok(result);
        }

        // GET FOLLOWING
        [HttpGet("{userId}/following")]
        public async Task<IActionResult> GetFollowing(Guid userId)
        {
            var result = await _followService.GetFollowingAsync(userId);
            return Ok(result);
        }

        // GET PENDING REQUESTS (for current user)
        [HttpGet("pending")]
        public async Task<IActionResult> GetPending()
        {
            var result = await _followService.GetPendingRequestsAsync(CurrentUserId);
            return Ok(result);
        }

        // GET RELATION STATUS
        [HttpGet("{targetUserId}/status")]
        public async Task<IActionResult> GetStatus(Guid targetUserId)
        {
            var result = await _followService.GetRelationStatusAsync(CurrentUserId, targetUserId);
            return Ok(result);
        }
    }
}
