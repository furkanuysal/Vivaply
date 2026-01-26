namespace Vivaply.API.Services.Infrastructure.RateLimiting
{
    public static class RateLimitPolicies
    {
        public const string LocationSearch = "location-search";

        public static readonly TimeSpan LocationWindow = TimeSpan.FromSeconds(10);
        public const int LocationPermitLimit = 10;
    }
}
