using Vivaply.API.Services.Infrastructure.Jobs;

namespace Vivaply.API.Services.Infrastructure
{
    public static class InfrastructureExtensions
    {
        public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
        {
            services.AddScoped<MetadataRefreshJob>();

            return services;
        }
    }
}