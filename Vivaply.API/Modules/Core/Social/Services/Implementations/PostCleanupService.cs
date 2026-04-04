using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class PostCleanupService(VivaplyDbContext db) : IPostCleanupService
    {
        private readonly VivaplyDbContext _db = db;

        public Task HidePostsForShowAsync(Guid userId, int tmdbShowId, CancellationToken cancellationToken = default)
        {
            var subjectId = tmdbShowId.ToString();

            return HideAsync(
                _db.UserPosts
                    .Include(x => x.Activity)
                    .Where(x =>
                        x.UserId == userId &&
                        !x.IsDeleted &&
                        x.Activity != null &&
                        (
                            (x.Activity.SubjectType == "tv_show" && x.Activity.SubjectId == subjectId) ||
                            (x.Activity.ParentEntityType == "tv_show" && x.Activity.ParentEntityId == subjectId)
                        )),
                cancellationToken);
        }

        public Task HidePostsForMovieAsync(Guid userId, int tmdbMovieId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "movie", tmdbMovieId.ToString(), cancellationToken);

        public Task HidePostsForGameAsync(Guid userId, int igdbId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "game", igdbId.ToString(), cancellationToken);

        public Task HidePostsForBookAsync(Guid userId, string googleBookId, CancellationToken cancellationToken = default)
            => HideBySubjectAsync(userId, "book", googleBookId, cancellationToken);

        private Task HideBySubjectAsync(Guid userId, string subjectType, string subjectId, CancellationToken cancellationToken)
        {
            return HideAsync(
                _db.UserPosts
                    .Include(x => x.Activity)
                    .Where(x =>
                        x.UserId == userId &&
                        !x.IsDeleted &&
                        x.Activity != null &&
                        x.Activity.SubjectType == subjectType &&
                        x.Activity.SubjectId == subjectId),
                cancellationToken);
        }

        private async Task HideAsync(IQueryable<UserPost> query, CancellationToken cancellationToken)
        {
            var posts = await query.ToListAsync(cancellationToken);
            if (posts.Count == 0)
            {
                return;
            }

            var deletedAt = DateTime.UtcNow;

            foreach (var post in posts)
            {
                post.IsDeleted = true;
                post.DeletedAt = deletedAt;
                post.UpdatedAt = deletedAt;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }
    }
}
