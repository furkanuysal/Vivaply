using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class ActivityCleanupService(VivaplyDbContext db) : IActivityCleanupService
    {
        private readonly VivaplyDbContext _db = db;

        public Task HideActivitiesForShowAsync(Guid userId, int tmdbShowId, CancellationToken cancellationToken = default)
        {
            var subjectId = tmdbShowId.ToString();

            return HideAsync(
                _db.UserActivities.Where(x =>
                    x.UserId == userId &&
                    !x.IsDeleted &&
                    (
                        (x.SubjectType == "tv_show" && x.SubjectId == subjectId) ||
                        (x.ParentEntityType == "tv_show" && x.ParentEntityId == subjectId)
                    )),
                cancellationToken
            );
        }

        public Task HideActivitiesForMovieAsync(Guid userId, int tmdbMovieId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "movie", tmdbMovieId.ToString(), cancellationToken);

        public Task HideActivitiesForGameAsync(Guid userId, int igdbId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "game", igdbId.ToString(), cancellationToken);

        public Task HideActivitiesForBookAsync(Guid userId, string googleBookId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "book", googleBookId, cancellationToken);

        private Task HideBySubjectAsync(
            Guid userId,
            string subjectType,
            string subjectId,
            CancellationToken cancellationToken)
        {
            return HideAsync(
                _db.UserActivities.Where(x =>
                    x.UserId == userId &&
                    !x.IsDeleted &&
                    x.SubjectType == subjectType &&
                    x.SubjectId == subjectId),
                cancellationToken
            );
        }

        private async Task HideAsync(
            IQueryable<UserActivity> query,
            CancellationToken cancellationToken)
        {
            var activities = await query.ToListAsync(cancellationToken);
            if (activities.Count == 0)
            {
                return;
            }

            var deletedAt = DateTime.UtcNow;

            foreach (var activity in activities)
            {
                activity.IsDeleted = true;
                activity.DeletedAt = deletedAt;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
