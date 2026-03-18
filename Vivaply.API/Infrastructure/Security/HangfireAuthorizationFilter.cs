using Hangfire.Dashboard;

namespace Vivaply.API.Infrastructure.Security
{
    public class HangfireAuthorizationFilter : IDashboardAuthorizationFilter
    {
        public bool Authorize(DashboardContext context)
        {
            var httpContext = context.GetHttpContext();

            return httpContext.User.Identity?.IsAuthenticated == true;
        }
    }
}
