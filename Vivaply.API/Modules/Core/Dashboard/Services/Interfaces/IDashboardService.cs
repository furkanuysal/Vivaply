using Vivaply.API.Modules.Core.Dashboard.DTOs;

namespace Vivaply.API.Modules.Core.Dashboard.Services.Interfaces
{
    public interface IDashboardService
    {
        Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid userId);
    }
}
