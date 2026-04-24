namespace Vivaply.API.Infrastructure.RateLimiting
{
    public static class RateLimitPolicies
    {
        public const string LocationSearch = "location-search";
        public const string Auth = "auth";
        public const string SearchRead = "search-read";
        public const string SocialCreate = "social-create";
        public const string SocialAction = "social-action";
        public const string LibraryWrite = "library-write";
        public const string AccountWrite = "account-write";

        public static readonly TimeSpan LocationWindow = TimeSpan.FromSeconds(10);
        public const int LocationPermitLimit = 10;

        public static readonly TimeSpan AuthWindow = TimeSpan.FromMinutes(5);
        public const int AuthPermitLimit = 12;

        public static readonly TimeSpan SearchReadWindow = TimeSpan.FromSeconds(15);
        public const int SearchReadPermitLimit = 30;

        public static readonly TimeSpan SocialCreateWindow = TimeSpan.FromMinutes(10);
        public const int SocialCreatePermitLimit = 20;

        public static readonly TimeSpan SocialActionWindow = TimeSpan.FromMinutes(1);
        public const int SocialActionPermitLimit = 60;

        public static readonly TimeSpan LibraryWriteWindow = TimeSpan.FromMinutes(1);
        public const int LibraryWritePermitLimit = 40;

        public static readonly TimeSpan AccountWriteWindow = TimeSpan.FromMinutes(10);
        public const int AccountWritePermitLimit = 12;
    }
}
