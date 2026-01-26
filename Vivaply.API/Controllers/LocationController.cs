using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Vivaply.API.Services.Infrastructure.RateLimiting;
using Vivaply.API.Services.Location;

namespace Vivaply.API.Controllers
{
    [EnableRateLimiting(RateLimitPolicies.LocationSearch)]
    [ApiController]
    [Route("api/[controller]")]
    public sealed class LocationController : ControllerBase
    {
        private readonly INominatimService _locationService;
        public LocationController(INominatimService locationService)
        {
            _locationService = locationService;
        }

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string q, CancellationToken ct)
        {
            var results = await _locationService.SearchAsync(q, ct);
            return Ok(results);
        }
    }
}
