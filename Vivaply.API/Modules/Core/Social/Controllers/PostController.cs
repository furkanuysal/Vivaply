using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
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
        public async Task<IActionResult> Reply(
            Guid id,
            [FromBody] CreateReplyPostRequest request,
            CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.TextContent))
            {
                return BadRequest("Reply text is required.");
            }

            var result = await _postService.CreateReplyAsync(CurrentUserId, id, request, cancellationToken);
            return result == null ? NotFound() : Ok(result);
        }
    }
}
