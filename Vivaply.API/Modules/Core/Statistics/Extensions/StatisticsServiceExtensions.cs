using Vivaply.API.Modules.Core.Statistics.Services.Implementations;
using Vivaply.API.Modules.Core.Statistics.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Statistics.Extensions
{
    public static class StatisticsServiceExtensions
    {
        public static IServiceCollection AddStatisticsServices(this IServiceCollection services)
        {
            services.AddScoped<IContentEngagementStatsService, ContentEngagementStatsService>();
            return services;
        }
    }
}
