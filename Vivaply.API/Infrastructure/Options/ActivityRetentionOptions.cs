namespace Vivaply.API.Infrastructure.Options
{
    public class ActivityRetentionOptions
    {
        public int DeletedRetentionDays { get; set; } = 90;
        public int PurgeBatchSize { get; set; } = 500;
    }
}
