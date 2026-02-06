namespace Vivaply.API.Services.Infrastructure.RateLimiting
{
    public static class RateLimitPolicies
    {
        public const string LocationSearch = "location-search";
        public const string MediaSync = "media-sync";

        public static readonly TimeSpan LocationWindow = TimeSpan.FromSeconds(10);
        public const int LocationPermitLimit = 10;

        public static readonly TimeSpan MediaSyncWindow = TimeSpan.FromMinutes(30);
        public const int MediaSyncPermitLimit = 1;
    }
}
