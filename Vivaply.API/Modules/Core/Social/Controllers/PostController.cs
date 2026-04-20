using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Controllers
{
    [Authorize]
    public class PostController(IPostService postService) : BaseApiController
    {
        private readonly IPostService _postService = postService;

        [HttpGet("api/feed")]
        public async Task<IActionResult> GetFeed([FromQuery] PostQuery query, CancellationToken cancellationToken)
        {
            var result = await _postService.GetFeedAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("api/bookmarks")]
        public async Task<IActionResult> GetBookmarks([FromQuery] PostQuery query, CancellationToken cancellationToken)
        {
            var result = await _postService.GetBookmarkedPostsAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpPost("api/posts")]
        [EnableRateLimiting(RateLimitPolicies.SocialCreate)]
        [RequestFormLimits(MultipartBodyLengthLimit = 120 * 1024 * 1024)]
        [RequestSizeLimit(120 * 1024 * 1024)]
        public async Task<IActionResult> Create(
            [FromForm] CreatePostRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.TextContent) && (request.Files == null || request.Files.Count == 0))
            {
                return BadRequest("Post text or media is required.");
            }

            var result = await _postService.CreateAsync(CurrentUserId, request, cancellationToken);
            return Ok(result);
        }

        [HttpPut("api/posts/{id:guid}")]
        [EnableRateLimiting(RateLimitPolicies.SocialCreate)]
        public async Task<IActionResult> Update(
            Guid id,
            [FromBody] UpdatePostRequest request,
            CancellationToken cancellationToken)
        {
            try
            {
                var result = await _postService.UpdateAsync(CurrentUserId, id, request, cancellationToken);
                return result == null ? NotFound() : Ok(result);
            }
            catch (ArgumentException exception)
            {
                return BadRequest(exception.Message);
            }
        }

        [HttpGet("api/users/{username}/posts")]
        public async Task<IActionResult> GetProfilePosts(
            string username,
            [FromQuery] PostQuery query,
            CancellationToken cancellationToken)
        {
            var result = await _postService.GetProfilePostsAsync(CurrentUserId, username, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("api/posts/{id:guid}")]
        public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.GetByIdAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("api/posts/{id:guid}/reply")]
        [EnableRateLimiting(RateLimitPolicies.SocialCreate)]
        [RequestFormLimits(MultipartBodyLengthLimit = 120 * 1024 * 1024)]
        [RequestSizeLimit(120 * 1024 * 1024)]
        public async Task<IActionResult> Reply(
            Guid id,
            [FromForm] CreateReplyPostRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.TextContent) && (request.Files == null || request.Files.Count == 0))
            {
                return BadRequest("Reply text or media is required.");
            }

            var result = await _postService.CreateReplyAsync(CurrentUserId, id, request, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("api/posts/{id:guid}/quote")]
        [EnableRateLimiting(RateLimitPolicies.SocialCreate)]
        [RequestFormLimits(MultipartBodyLengthLimit = 120 * 1024 * 1024)]
        [RequestSizeLimit(120 * 1024 * 1024)]
        public async Task<IActionResult> Quote(
            Guid id,
            [FromForm] CreateQuotePostRequest request,
            CancellationToken cancellationToken)
        {
            var result = await _postService.CreateQuoteAsync(CurrentUserId, id, request, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("api/posts/{id:guid}")]
        [EnableRateLimiting(RateLimitPolicies.SocialCreate)]
        public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.DeleteAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("api/posts/{id:guid}/like")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Like(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.LikeAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("api/posts/{id:guid}/like")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Unlike(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.UnlikeAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpPost("api/posts/{id:guid}/bookmark")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> Bookmark(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.BookmarkAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }

        [HttpDelete("api/posts/{id:guid}/bookmark")]
        [EnableRateLimiting(RateLimitPolicies.SocialAction)]
        public async Task<IActionResult> RemoveBookmark(Guid id, CancellationToken cancellationToken)
        {
            var result = await _postService.RemoveBookmarkAsync(CurrentUserId, id, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }
    }
}
