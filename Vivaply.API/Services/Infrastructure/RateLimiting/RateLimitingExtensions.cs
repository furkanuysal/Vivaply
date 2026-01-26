using System.Threading.RateLimiting;

namespace Vivaply.API.Services.Infrastructure.RateLimiting
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddVivaplyRateLimiting(
            this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.AddPolicy(RateLimitPolicies.LocationSearch, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.LocationPermitLimit,
                            Window = RateLimitPolicies.LocationWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));
            });

            return services;
        }
    }
}
