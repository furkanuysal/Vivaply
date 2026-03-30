using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Services.Dashboard;

namespace Vivaply.API.Modules.Core.Dashboard.Controllers
{
    [Authorize]
    [Route("api/dashboard")]
    public class DashboardController(IDashboardService dashboardService) : BaseApiController
    {
        private readonly IDashboardService _dashboardService = dashboardService;

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _dashboardService.GetDashboardSummaryAsync(CurrentUserId);
            return Ok(data);
        }
    }
}
