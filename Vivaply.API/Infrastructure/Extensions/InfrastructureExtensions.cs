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
            services.AddOptions<ActivityRetentionOptions>()
                .Bind(configuration.GetSection("ActivityRetention"))
                .Validate(x => x.DeletedRetentionDays > 0, "DeletedRetentionDays must be > 0")
                .Validate(x => x.PurgeBatchSize > 0, "PurgeBatchSize must be > 0")
                .ValidateOnStart();

            services.AddOptions<MetadataRefreshOptions>()
                .Bind(configuration.GetSection("MetadataRefresh"))
                .Validate(x => x.BatchSize > 0, "BatchSize must be > 0")
                .Validate(x => x.MaxConcurrency > 0, "MaxConcurrency must be > 0")
                .ValidateOnStart();

            // Jobs
            services.AddScoped<ActivityRetentionJob>();
            services.AddScoped<MetadataRefreshJob>();
            services.AddScoped<IApplicationEventPublisher, ApplicationEventPublisher>();

            return services;
        }
    }
}
