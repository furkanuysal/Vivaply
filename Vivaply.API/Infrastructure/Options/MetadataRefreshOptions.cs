namespace Vivaply.API.Infrastructure.Options
{
    public class MetadataRefreshOptions
    {
        public int MovieTtlDays { get; set; } = 14;
        public int ShowTtlDays { get; set; } = 7;
        public int GameTtlDays { get; set; } = 14;
        public int BookTtlDays { get; set; } = 60;

        public int BatchSize { get; set; } = 50;
        public int MaxConcurrency { get; set; } = 5;
    }
}
