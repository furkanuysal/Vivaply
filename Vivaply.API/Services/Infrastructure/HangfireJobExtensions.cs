using Hangfire;
using Vivaply.API.Services.Infrastructure.Jobs;

namespace Vivaply.API.Services.Infrastructure
{
    public static class HangfireJobExtensions
    {
        public static void UseVivaplyJobs(this IApplicationBuilder app)
        {
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
        }
    }
}