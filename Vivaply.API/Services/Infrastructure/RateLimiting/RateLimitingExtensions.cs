using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
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
                // Generic Rejected Handler
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                    string code = "rate_limited";
                    string message = "Too many requests. Please try again later.";

                    var endpoint = context.HttpContext.GetEndpoint();
                    var rateLimitAttr = endpoint?.Metadata.GetMetadata<EnableRateLimitingAttribute>();

                    if (rateLimitAttr?.PolicyName == RateLimitPolicies.MediaSync)
                    {
                        code = "library_sync_limited";
                        message = "Library was recently synced.";
                    }

                    // Set Retry-After header to 60 seconds for all rate-limited responses
                    context.HttpContext.Response.Headers.RetryAfter = "60";

                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        code = code,
                        message = message
                    }, token);
                };

                // Policy 1: Location Search (IP based - Fixed Window)
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

                // Policy 2: Media Library Sync (User based - Fixed Window)
                options.AddPolicy(RateLimitPolicies.MediaSync, context =>
                {
                    var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "anonymous";

                    return RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: $"media-sync:{userId}",
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.MediaSyncPermitLimit,
                            Window = RateLimitPolicies.MediaSyncWindow,
                            QueueLimit = 0,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst
                        });
                });
            });

            return services;
        }
    }
}