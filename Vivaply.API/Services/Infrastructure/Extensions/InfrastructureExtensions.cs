using Vivaply.API.Services.Infrastructure.Jobs;
using Vivaply.API.Services.Infrastructure.Options;

namespace Vivaply.API.Services.Infrastructure.Extensions
{
    public static class InfrastructureServiceExtensions
    {
        public static IServiceCollection AddInfrastructureServices(
            this IServiceCollection services,
            IConfiguration configuration)
        {
            // Options (validated)
            services.AddOptions<MetadataRefreshOptions>()
                .Bind(configuration.GetSection("MetadataRefresh"))
                .Validate(x => x.BatchSize > 0, "BatchSize must be > 0")
                .Validate(x => x.MaxConcurrency > 0, "MaxConcurrency must be > 0")
                .ValidateOnStart();

            // Jobs
            services.AddScoped<MetadataRefreshJob>();

            return services;
        }
    }
}