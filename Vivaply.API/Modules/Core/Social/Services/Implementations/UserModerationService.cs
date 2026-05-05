using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Notifications.Enums;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Follows;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class UserModerationService(VivaplyDbContext db) : IUserModerationService
    {
        private readonly VivaplyDbContext _db = db;

        public async Task BlockAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
        {
            ValidateTarget(currentUserId, targetUserId);

            var targetExists = await _db.Users
                .AsNoTracking()
                .AnyAsync(x => x.Id == targetUserId, cancellationToken);

            if (!targetExists)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var exists = await _db.UserBlocks
                .AnyAsync(x => x.BlockerId == currentUserId && x.BlockedId == targetUserId, cancellationToken);

            if (exists)
            {
                return;
            }

            _db.UserMutes.RemoveRange(await _db.UserMutes
                .Where(x => x.MuterId == currentUserId && x.MutedId == targetUserId)
                .ToListAsync(cancellationToken));

            _db.UserBlocks.Add(new UserBlock
            {
                BlockerId = currentUserId,
                BlockedId = targetUserId
            });

            await RemoveSocialGraphAsync(currentUserId, targetUserId, cancellationToken);
            await RemoveNotificationEdgesAsync(currentUserId, targetUserId, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task UnblockAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
        {
            ValidateTarget(currentUserId, targetUserId);

            var block = await _db.UserBlocks
                .FirstOrDefaultAsync(x => x.BlockerId == currentUserId && x.BlockedId == targetUserId, cancellationToken);

            if (block == null)
            {
                return;
            }

            _db.UserBlocks.Remove(block);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task MuteAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
        {
            ValidateTarget(currentUserId, targetUserId);

            if (await IsBlockedEitherWayAsync(currentUserId, targetUserId, cancellationToken))
            {
                throw new InvalidOperationException("Blocked users cannot be muted.");
            }

            var targetExists = await _db.Users
                .AsNoTracking()
                .AnyAsync(x => x.Id == targetUserId, cancellationToken);

            if (!targetExists)
            {
                throw new KeyNotFoundException("User not found.");
            }

            var exists = await _db.UserMutes
                .AnyAsync(x => x.MuterId == currentUserId && x.MutedId == targetUserId, cancellationToken);

            if (exists)
            {
                return;
            }

            _db.UserMutes.Add(new UserMute
            {
                MuterId = currentUserId,
                MutedId = targetUserId
            });

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task UnmuteAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
        {
            ValidateTarget(currentUserId, targetUserId);

            var mute = await _db.UserMutes
                .FirstOrDefaultAsync(x => x.MuterId == currentUserId && x.MutedId == targetUserId, cancellationToken);

            if (mute == null)
            {
                return;
            }

            _db.UserMutes.Remove(mute);
            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<List<FollowUserDto>> GetBlockedUsersAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            return await _db.UserBlocks
                .AsNoTracking()
                .Where(x => x.BlockerId == currentUserId)
                .Select(x => new FollowUserDto
                {
                    Id = x.Blocked!.Id,
                    Username = x.Blocked.Username,
                    AvatarUrl = x.Blocked.AvatarUrl,
                    IsFollowingCurrentUser = false
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<List<FollowUserDto>> GetMutedUsersAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            return await _db.UserMutes
                .AsNoTracking()
                .Where(x => x.MuterId == currentUserId)
                .Select(x => new FollowUserDto
                {
                    Id = x.Muted!.Id,
                    Username = x.Muted.Username,
                    AvatarUrl = x.Muted.AvatarUrl,
                    IsFollowingCurrentUser = false
                })
                .ToListAsync(cancellationToken);
        }

        public async Task<bool> IsBlockedEitherWayAsync(Guid currentUserId, Guid otherUserId, CancellationToken cancellationToken = default)
        {
            return await _db.UserBlocks
                .AsNoTracking()
                .AnyAsync(x =>
                    (x.BlockerId == currentUserId && x.BlockedId == otherUserId) ||
                    (x.BlockerId == otherUserId && x.BlockedId == currentUserId),
                    cancellationToken);
        }

        public async Task<HashSet<Guid>> GetBlockedOrBlockingUserIdsAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            var userIds = await _db.UserBlocks
                .AsNoTracking()
                .Where(x => x.BlockerId == currentUserId || x.BlockedId == currentUserId)
                .Select(x => x.BlockerId == currentUserId ? x.BlockedId : x.BlockerId)
                .ToListAsync(cancellationToken);

            return userIds.ToHashSet();
        }

        public async Task<HashSet<Guid>> GetMutedUserIdsAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            var userIds = await _db.UserMutes
                .AsNoTracking()
                .Where(x => x.MuterId == currentUserId)
                .Select(x => x.MutedId)
                .ToListAsync(cancellationToken);

            return userIds.ToHashSet();
        }

        private async Task RemoveSocialGraphAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken)
        {
            _db.UserFollows.RemoveRange(await _db.UserFollows
                .Where(x =>
                    (x.FollowerId == currentUserId && x.FollowingId == targetUserId) ||
                    (x.FollowerId == targetUserId && x.FollowingId == currentUserId))
                .ToListAsync(cancellationToken));
        }

        private async Task RemoveNotificationEdgesAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken)
        {
            _db.UserNotifications.RemoveRange(await _db.UserNotifications
                .Where(x =>
                    (x.ActorUserId == currentUserId && x.RecipientUserId == targetUserId) ||
                    (x.ActorUserId == targetUserId && x.RecipientUserId == currentUserId))
                .Where(x => x.Category == NotificationCategory.Social)
                .ToListAsync(cancellationToken));
        }

        private static void ValidateTarget(Guid currentUserId, Guid targetUserId)
        {
            if (currentUserId == targetUserId)
            {
                throw new InvalidOperationException("You cannot perform this action on yourself.");
            }
        }
    }
}
