using Microsoft.AspNetCore.RateLimiting;
using System.Security.Claims;
using System.Threading.RateLimiting;

namespace Vivaply.API.Infrastructure.RateLimiting
{
    public static class RateLimitingExtensions
    {
        public static IServiceCollection AddVivaplyRateLimiting(this IServiceCollection services)
        {
            services.AddRateLimiter(options =>
            {
                options.OnRejected = async (context, token) =>
                {
                    context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;

                    var endpoint = context.HttpContext.GetEndpoint();
                    var rateLimitAttr = endpoint?.Metadata.GetMetadata<EnableRateLimitingAttribute>();
                    var rejection = BuildRejection(rateLimitAttr?.PolicyName);

                    if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    {
                        rejection = rejection with
                        {
                            RetryAfterSeconds = Math.Max(1, (int)Math.Ceiling(retryAfter.TotalSeconds))
                        };
                    }

                    context.HttpContext.Response.Headers.RetryAfter = rejection.RetryAfterSeconds.ToString();

                    await context.HttpContext.Response.WriteAsJsonAsync(new
                    {
                        code = rejection.Code,
                        message = rejection.Message,
                        retryAfterSeconds = rejection.RetryAfterSeconds
                    }, token);
                };

                options.AddPolicy(RateLimitPolicies.LocationSearch, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: BuildIpPartitionKey(context, RateLimitPolicies.LocationSearch),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.LocationPermitLimit,
                            Window = RateLimitPolicies.LocationWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.AddPolicy(RateLimitPolicies.Auth, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: BuildIpPartitionKey(context, RateLimitPolicies.Auth),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.AuthPermitLimit,
                            Window = RateLimitPolicies.AuthWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.AddPolicy(RateLimitPolicies.SocialCreate, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: BuildUserPartitionKey(context, RateLimitPolicies.SocialCreate),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.SocialCreatePermitLimit,
                            Window = RateLimitPolicies.SocialCreateWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.AddPolicy(RateLimitPolicies.SocialAction, context =>
                    RateLimitPartition.GetTokenBucketLimiter(
                        partitionKey: BuildUserPartitionKey(context, RateLimitPolicies.SocialAction),
                        factory: _ => new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = RateLimitPolicies.SocialActionPermitLimit,
                            TokensPerPeriod = RateLimitPolicies.SocialActionPermitLimit,
                            ReplenishmentPeriod = RateLimitPolicies.SocialActionWindow,
                            AutoReplenishment = true,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.AddPolicy(RateLimitPolicies.LibraryWrite, context =>
                    RateLimitPartition.GetTokenBucketLimiter(
                        partitionKey: BuildUserPartitionKey(context, RateLimitPolicies.LibraryWrite),
                        factory: _ => new TokenBucketRateLimiterOptions
                        {
                            TokenLimit = RateLimitPolicies.LibraryWritePermitLimit,
                            TokensPerPeriod = RateLimitPolicies.LibraryWritePermitLimit,
                            ReplenishmentPeriod = RateLimitPolicies.LibraryWriteWindow,
                            AutoReplenishment = true,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));

                options.AddPolicy(RateLimitPolicies.AccountWrite, context =>
                    RateLimitPartition.GetFixedWindowLimiter(
                        partitionKey: BuildUserPartitionKey(context, RateLimitPolicies.AccountWrite),
                        factory: _ => new FixedWindowRateLimiterOptions
                        {
                            PermitLimit = RateLimitPolicies.AccountWritePermitLimit,
                            Window = RateLimitPolicies.AccountWriteWindow,
                            QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                            QueueLimit = 0
                        }));
            });

            return services;
        }

        private static RateLimitRejection BuildRejection(string? policyName)
        {
            return policyName switch
            {
                RateLimitPolicies.Auth => new(
                    "auth_rate_limited",
                    "Too many authentication attempts. Please try again later.",
                    (int)RateLimitPolicies.AuthWindow.TotalSeconds),
                RateLimitPolicies.SocialCreate => new(
                    "post_rate_limited",
                    "You are posting too quickly. Please slow down and try again shortly.",
                    (int)RateLimitPolicies.SocialCreateWindow.TotalSeconds),
                RateLimitPolicies.SocialAction => new(
                    "interaction_rate_limited",
                    "You are interacting too quickly. Please try again shortly.",
                    (int)RateLimitPolicies.SocialActionWindow.TotalSeconds),
                RateLimitPolicies.LibraryWrite => new(
                    "library_write_rate_limited",
                    "You are updating your library too quickly. Please try again shortly.",
                    (int)RateLimitPolicies.LibraryWriteWindow.TotalSeconds),
                RateLimitPolicies.AccountWrite => new(
                    "account_rate_limited",
                    "Too many account updates. Please try again later.",
                    (int)RateLimitPolicies.AccountWriteWindow.TotalSeconds),
                _ => new(
                    "rate_limited",
                    "Too many requests. Please try again later.",
                    60)
            };
        }

        private static string BuildUserPartitionKey(HttpContext context, string policyName)
        {
            var userId = context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!string.IsNullOrWhiteSpace(userId))
            {
                return $"{policyName}:user:{userId}";
            }

            return BuildIpPartitionKey(context, policyName);
        }

        private static string BuildIpPartitionKey(HttpContext context, string policyName)
        {
            var forwardedFor = context.Request.Headers["X-Forwarded-For"].FirstOrDefault();
            var ip = forwardedFor?.Split(',').FirstOrDefault()?.Trim();

            if (string.IsNullOrWhiteSpace(ip))
            {
                ip = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            }

            return $"{policyName}:ip:{ip}";
        }

        private sealed record RateLimitRejection(
            string Code,
            string Message,
            int RetryAfterSeconds);
    }
}
