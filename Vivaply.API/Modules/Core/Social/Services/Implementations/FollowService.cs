using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Notifications.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Follows;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class FollowService(
        VivaplyDbContext db,
        INotificationService notificationService,
        IUserModerationService userModerationService) : IFollowService
    {
        private readonly VivaplyDbContext _db = db;
        private readonly INotificationService _notificationService = notificationService;
        private readonly IUserModerationService _userModerationService = userModerationService;

        public async Task FollowAsync(Guid currentUserId, Guid targetUserId)
        {
            if (currentUserId == targetUserId)
                throw new Exception("You cannot follow yourself.");

            if (await _userModerationService.IsBlockedEitherWayAsync(currentUserId, targetUserId))
                throw new Exception("This user is not available.");

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

            if (status == FollowStatus.Accepted)
            {
                await _notificationService.CreateFollowNotificationAsync(currentUserId, targetUserId);
            }
            else
            {
                await _notificationService.CreateFollowRequestNotificationAsync(currentUserId, targetUserId);
            }
        }

        public async Task UnfollowAsync(Guid currentUserId, Guid targetUserId)
        {
            var existing = await _db.UserFollows
                .FirstOrDefaultAsync(x =>
                    x.FollowerId == currentUserId &&
                    x.FollowingId == targetUserId);

            if (existing == null)
                throw new Exception("Follow relation not found.");

            var previousStatus = existing.Status;
            _db.UserFollows.Remove(existing);
            await _db.SaveChangesAsync();

            if (previousStatus == FollowStatus.Pending)
            {
                await _notificationService.RemoveFollowRequestNotificationAsync(currentUserId, targetUserId);
            }
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
            await _notificationService.RemoveFollowRequestNotificationAsync(requesterId, currentUserId);
            await _notificationService.CreateFollowAcceptedNotificationAsync(currentUserId, requesterId);
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
            await _notificationService.RemoveFollowRequestNotificationAsync(requesterId, currentUserId);
        }

        public async Task<List<FollowUserDto>> GetFollowersAsync(Guid currentUserId, Guid userId)
        {
            if (await _userModerationService.IsBlockedEitherWayAsync(currentUserId, userId))
                return [];

            var blockedIds = await _userModerationService.GetBlockedOrBlockingUserIdsAsync(currentUserId);
            var followerIds = await _db.UserFollows
                .Where(x => x.FollowingId == userId && x.Status == FollowStatus.Accepted)
                .Where(x => !blockedIds.Contains(x.FollowerId))
                .Select(x => x.FollowerId)
                .ToListAsync();

            var followsCurrentUserIds = await _db.UserFollows
                .Where(x =>
                    x.FollowingId == currentUserId &&
                    x.Status == FollowStatus.Accepted &&
                    followerIds.Contains(x.FollowerId))
                .Select(x => x.FollowerId)
                .ToListAsync();

            var followsCurrentUserSet = followsCurrentUserIds.ToHashSet();

            return await _db.UserFollows
                .Where(x => x.FollowingId == userId && x.Status == FollowStatus.Accepted)
                .Where(x => !blockedIds.Contains(x.FollowerId))
                .Select(x => new FollowUserDto
                {
                    Id = x.Follower.Id,
                    Username = x.Follower.Username,
                    AvatarUrl = x.Follower.AvatarUrl,
                    IsFollowingCurrentUser =
                        x.Follower.Id != currentUserId &&
                        followsCurrentUserSet.Contains(x.Follower.Id)
                })
                .ToListAsync();
        }

        public async Task<List<FollowUserDto>> GetFollowingAsync(Guid currentUserId, Guid userId)
        {
            if (await _userModerationService.IsBlockedEitherWayAsync(currentUserId, userId))
                return [];

            var blockedIds = await _userModerationService.GetBlockedOrBlockingUserIdsAsync(currentUserId);
            var followingIds = await _db.UserFollows
                .Where(x => x.FollowerId == userId && x.Status == FollowStatus.Accepted)
                .Where(x => !blockedIds.Contains(x.FollowingId))
                .Select(x => x.FollowingId)
                .ToListAsync();

            var followsCurrentUserIds = await _db.UserFollows
                .Where(x =>
                    x.FollowingId == currentUserId &&
                    x.Status == FollowStatus.Accepted &&
                    followingIds.Contains(x.FollowerId))
                .Select(x => x.FollowerId)
                .ToListAsync();

            var followsCurrentUserSet = followsCurrentUserIds.ToHashSet();

            return await _db.UserFollows
                .Where(x => x.FollowerId == userId && x.Status == FollowStatus.Accepted)
                .Where(x => !blockedIds.Contains(x.FollowingId))
                .Select(x => new FollowUserDto
                {
                    Id = x.Following.Id,
                    Username = x.Following.Username,
                    AvatarUrl = x.Following.AvatarUrl,
                    IsFollowingCurrentUser =
                        x.Following.Id != currentUserId &&
                        followsCurrentUserSet.Contains(x.Following.Id)
                })
                .ToListAsync();
        }

        public async Task<List<Guid>> GetPendingRequestsAsync(Guid userId)
        {
            var blockedIds = await _userModerationService.GetBlockedOrBlockingUserIdsAsync(userId);
            return await _db.UserFollows
                .Where(x => x.FollowingId == userId && x.Status == FollowStatus.Pending)
                .Where(x => !blockedIds.Contains(x.FollowerId))
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
