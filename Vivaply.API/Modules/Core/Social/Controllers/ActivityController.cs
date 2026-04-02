using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Controllers
{
    [Authorize]
    [Route("api/activities")]
    public class ActivityController(IActivityService activityService) : BaseApiController
    {
        private readonly IActivityService _activityService = activityService;

        [HttpGet("feed")]
        public async Task<IActionResult> GetFeed([FromQuery] ActivityQuery query, CancellationToken cancellationToken)
        {
            var result = await _activityService.GetFeedAsync(CurrentUserId, query, cancellationToken);
            return Ok(result);
        }

        [HttpGet("/api/users/{username}/activities")]
        public async Task<IActionResult> GetProfileActivities(
            string username,
            [FromQuery] ActivityQuery query,
            CancellationToken cancellationToken)
        {
            var result = await _activityService.GetProfileActivitiesAsync(CurrentUserId, username, query, cancellationToken);
            return Ok(result);
        }
    }
}
