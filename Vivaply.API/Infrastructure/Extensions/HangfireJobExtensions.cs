using Hangfire;
using Vivaply.API.Infrastructure.Jobs;

namespace Vivaply.API.Infrastructure.Extensions
{
    public static class HangfireJobExtensions
    {
        public static void UseVivaplyJobs(this IApplicationBuilder app)
        {
            RecurringJob.AddOrUpdate<ActivityRetentionJob>(
                "purge-deleted-activities",
                x => x.PurgeDeletedActivitiesAsync(),
                Cron.Daily
            );

            RecurringJob.AddOrUpdate<MetadataRefreshJob>(
                "refresh-movies",
                x => x.RefreshMoviesAsync(),
                Cron.Daily
            );

            RecurringJob.AddOrUpdate<MetadataRefreshJob>(
                "refresh-tv",
                x => x.RefreshShowsAsync(),
                Cron.Daily
            );

            RecurringJob.AddOrUpdate<MetadataRefreshJob>(
                "refresh-games",
                x => x.RefreshGamesAsync(),
                Cron.Daily
            );

            RecurringJob.AddOrUpdate<MetadataRefreshJob>(
                "refresh-books",
                x => x.RefreshBooksAsync(),
                Cron.Daily
            );
        }
    }
}
