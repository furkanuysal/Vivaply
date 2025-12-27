using Vivaply.API.DTOs.Dashboard;

namespace Vivaply.API.Services.Dashboard
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid userId);
    }
}
