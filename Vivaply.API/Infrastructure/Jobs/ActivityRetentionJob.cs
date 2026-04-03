using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Vivaply.API.Data;
using Vivaply.API.Infrastructure.Options;

namespace Vivaply.API.Infrastructure.Jobs
{
    public class ActivityRetentionJob(
        IServiceScopeFactory scopeFactory,
        IOptions<ActivityRetentionOptions> options,
        ILogger<ActivityRetentionJob> logger)
    {
        private readonly IServiceScopeFactory _scopeFactory = scopeFactory;
        private readonly ActivityRetentionOptions _options = options.Value;
        private readonly ILogger<ActivityRetentionJob> _logger = logger;

        public async Task PurgeDeletedActivitiesAsync()
        {
            using var scope = _scopeFactory.CreateScope();

            var db = scope.ServiceProvider.GetRequiredService<VivaplyDbContext>();
            var cutoff = DateTime.UtcNow.AddDays(-_options.DeletedRetentionDays);

            var query = db.UserActivities
                .Where(x =>
                    x.IsDeleted &&
                    x.DeletedAt != null &&
                    x.DeletedAt < cutoff)
                .OrderBy(x => x.DeletedAt)
                .Take(_options.PurgeBatchSize);

            var deletedCount = await query.ExecuteDeleteAsync();

            _logger.LogInformation(
                "[ActivityRetention] Purged {Count} deleted activities older than {RetentionDays} days.",
                deletedCount,
                _options.DeletedRetentionDays);
        }
    }
}
