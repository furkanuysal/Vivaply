using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Controllers
{
    [Authorize]
    [Route("api/recommendations")]
    public class RecommendationController(IRecommendationService service) : BaseApiController
    {
        private readonly IRecommendationService _service = service;

        [HttpGet]
        public async Task<IActionResult> Get(string language = "en-US")
        {
            var result = await _service.GetRecommendationsAsync(CurrentUserId, language);
            return Ok(result);
        }
    }
}