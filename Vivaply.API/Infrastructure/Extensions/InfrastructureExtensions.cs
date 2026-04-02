using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Infrastructure.Jobs;
using Vivaply.API.Infrastructure.Options;

namespace Vivaply.API.Infrastructure.Extensions
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
            services.AddScoped<IApplicationEventPublisher, ApplicationEventPublisher>();

            return services;
        }
    }
}
