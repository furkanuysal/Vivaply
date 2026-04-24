using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.RateLimiting;
using Vivaply.API.Modules.Core.Search.DTOs.Queries;
using Vivaply.API.Modules.Core.Search.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Search.Controllers
{
    [Authorize]
    public class SearchController(ISearchService searchService) : BaseApiController
    {
        private readonly ISearchService _searchService = searchService;

        [HttpGet("api/search")]
        [EnableRateLimiting(RateLimitPolicies.SearchRead)]
        public async Task<IActionResult> Search([FromQuery] SearchQuery query, CancellationToken cancellationToken)
        {
            var result = await _searchService.SearchAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("api/search/users")]
        [EnableRateLimiting(RateLimitPolicies.SearchRead)]
        public async Task<IActionResult> SearchUsers([FromQuery] SearchQuery query, CancellationToken cancellationToken)
        {
            var result = await _searchService.SearchUsersAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("api/search/posts")]
        [EnableRateLimiting(RateLimitPolicies.SearchRead)]
        public async Task<IActionResult> SearchPosts([FromQuery] SearchQuery query, CancellationToken cancellationToken)
        {
            var result = await _searchService.SearchPostsAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }
    }
}
