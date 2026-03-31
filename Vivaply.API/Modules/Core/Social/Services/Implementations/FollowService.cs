using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class FollowService(VivaplyDbContext db) : IFollowService
    {
        private readonly VivaplyDbContext _db = db;

        public async Task FollowAsync(Guid currentUserId, Guid targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new Exception("You cannot follow yourself.");

            var existing = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == currentUserId &&
                    x.FollowingId == targetUserId);

            if (existing != null)
                throw new Exception("Already followed or pending.");

            var target = await _db.Users
                .Include(x => x.Preferences)
                .FirstOrDefaultAsync(x => x.Id == targetUserId);

            if (target == null)
                throw new Exception("User not found.");

            if (target.Preferences?.FollowPolicy == FollowPolicy.Disabled)
                throw new Exception("This user does not accept followers.");

            var status = target.Preferences?.FollowPolicy == FollowPolicy.AutoAccept
                ? FollowStatus.Accepted
                : FollowStatus.Pending;

            var follow = new UserFollow
            {
                Id = Guid.NewGuid(),
                FollowerId = currentUserId,
                FollowingId = targetUserId,
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            _db.UserFollows.Add(follow);
            await _db.SaveChangesAsync();
        }

        public async Task UnfollowAsync(Guid currentUserId, Guid targetUserId)
        {
            var existing = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == currentUserId &&
                    x.FollowingId == targetUserId);

            if (existing == null)
                throw new Exception("Follow relation not found.");

            _db.UserFollows.Remove(existing);
            await _db.SaveChangesAsync();
        }

        public async Task AcceptRequestAsync(Guid currentUserId, Guid requesterId)
        {
            var follow = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == requesterId &&
                    x.FollowingId == currentUserId &&
                    x.Status == FollowStatus.Pending);

            if (follow == null)
                throw new Exception("Request not found.");

            follow.Status = FollowStatus.Accepted;
            follow.RespondedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync();
        }

        public async Task RejectRequestAsync(Guid currentUserId, Guid requesterId)
        {
            var follow = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == requesterId &&
                    x.FollowingId == currentUserId &&
                    x.Status == FollowStatus.Pending);

            if (follow == null)
                throw new Exception("Request not found.");

            _db.UserFollows.Remove(follow);
            await _db.SaveChangesAsync();
        }

        public async Task<List<Guid>> GetFollowersAsync(Guid userId)
        {
            return await _db.UserFollows
                .Where(x => x.FollowingId == userId && x.Status == FollowStatus.Accepted)
                .Select(x => x.FollowerId)
                .ToListAsync();
        }

        public async Task<List<Guid>> GetFollowingAsync(Guid userId)
        {
            return await _db.UserFollows
                .Where(x => x.FollowerId == userId && x.Status == FollowStatus.Accepted)
                .Select(x => x.FollowingId)
                .ToListAsync();
        }

        public async Task<List<Guid>> GetPendingRequestsAsync(Guid userId)
        {
            return await _db.UserFollows
                .Where(x => x.FollowingId == userId && x.Status == FollowStatus.Pending)
                .Select(x => x.FollowerId)
                .ToListAsync();
        }

        public async Task<FollowStatus?> GetRelationStatusAsync(Guid currentUserId, Guid targetUserId)
        {
            var follow = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == currentUserId &&
                    x.FollowingId == targetUserId);

            return follow?.Status;
        }
    }
}
