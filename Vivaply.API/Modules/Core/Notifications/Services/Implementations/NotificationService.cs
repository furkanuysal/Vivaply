using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Notifications.DTOs.Queries;
using Vivaply.API.Modules.Core.Notifications.DTOs.Results;
using Vivaply.API.Modules.Core.Notifications.Enums;
using Vivaply.API.Modules.Core.Notifications.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Notifications.Services.Implementations
{
    public class NotificationService(
        VivaplyDbContext dbContext,
        IUserModerationService userModerationService) : INotificationService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private readonly IUserModerationService _userModerationService = userModerationService;

        public async Task<NotificationListDto> GetAsync(Guid currentUserId, NotificationQuery query, CancellationToken cancellationToken = default)
        {
            query ??= new NotificationQuery();
            var take = Math.Clamp(query.Take, 1, 50);
            var hiddenActorIds = await GetHiddenActorIdsAsync(currentUserId, cancellationToken);

            var baseQuery = _dbContext.UserNotifications
                .AsNoTracking()
                .Include(x => x.ActorUser)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.Activity)
                .Where(x => x.RecipientUserId == currentUserId)
                .Where(x => x.ActorUserId == null || !hiddenActorIds.Contains(x.ActorUserId.Value));

            var unreadCount = await baseQuery
                .CountAsync(x => !x.IsRead, cancellationToken);

            if (query.UnreadOnly)
            {
                baseQuery = baseQuery.Where(x => !x.IsRead);
            }

            var notifications = await baseQuery
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .Take(take)
                .ToListAsync(cancellationToken);

            return new NotificationListDto
            {
                Items = notifications.Select(MapToDto).ToList(),
                UnreadCount = unreadCount
            };
        }

        public async Task<NotificationUnreadCountDto> GetUnreadCountAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            var hiddenActorIds = await GetHiddenActorIdsAsync(currentUserId, cancellationToken);
            var count = await _dbContext.UserNotifications
                .AsNoTracking()
                .Where(x => x.RecipientUserId == currentUserId && !x.IsRead)
                .Where(x => x.ActorUserId == null || !hiddenActorIds.Contains(x.ActorUserId.Value))
                .CountAsync(cancellationToken);

            return new NotificationUnreadCountDto
            {
                Count = count
            };
        }

        public async Task<bool> MarkAsReadAsync(Guid currentUserId, Guid notificationId, CancellationToken cancellationToken = default)
        {
            var updated = await _dbContext.UserNotifications
                .Where(x => x.Id == notificationId && x.RecipientUserId == currentUserId && !x.IsRead)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.IsRead, true)
                    .SetProperty(x => x.ReadAt, DateTime.UtcNow), cancellationToken);

            return updated > 0;
        }

        public async Task<int> MarkAllAsReadAsync(Guid currentUserId, CancellationToken cancellationToken = default)
        {
            return await _dbContext.UserNotifications
                .Where(x => x.RecipientUserId == currentUserId && !x.IsRead)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.IsRead, true)
                    .SetProperty(x => x.ReadAt, DateTime.UtcNow), cancellationToken);
        }

        public Task CreateFollowNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default)
        {
            return CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.Follow, null, cancellationToken);
        }

        public Task CreateFollowRequestNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default)
        {
            return CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.FollowRequest, null, cancellationToken);
        }

        public Task CreateFollowAcceptedNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default)
        {
            return CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.FollowAccepted, null, cancellationToken);
        }

        public async Task RemoveFollowRequestNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default)
        {
            await _dbContext.UserNotifications
                .Where(x =>
                    x.ActorUserId == actorUserId &&
                    x.RecipientUserId == recipientUserId &&
                    x.Type == NotificationType.FollowRequest)
                .ExecuteDeleteAsync(cancellationToken);
        }

        public async Task CreateLikeNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            if (await HasExistingAsync(actorUserId, recipientUserId, NotificationType.Like, postId, cancellationToken))
            {
                return;
            }

            await CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.Like, postId, cancellationToken);
        }

        public async Task RemoveLikeNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            await _dbContext.UserNotifications
                .Where(x =>
                    x.ActorUserId == actorUserId &&
                    x.RecipientUserId == recipientUserId &&
                    x.Type == NotificationType.Like &&
                    x.PostId == postId)
                .ExecuteDeleteAsync(cancellationToken);
        }

        public Task CreateReplyNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            return CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.Reply, postId, cancellationToken);
        }

        public Task CreateQuoteNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            return CreateNotificationAsync(actorUserId, recipientUserId, NotificationType.Quote, postId, cancellationToken);
        }

        public async Task CreateMentionNotificationsAsync(Guid actorUserId, Guid postId, IReadOnlyCollection<Guid> recipientUserIds, CancellationToken cancellationToken = default)
        {
            var distinctRecipients = recipientUserIds
                .Where(x => x != actorUserId)
                .Distinct()
                .ToList();

            if (distinctRecipients.Count == 0)
            {
                return;
            }

            var existingRecipients = await _dbContext.UserNotifications
                .AsNoTracking()
                .Where(x =>
                    x.Type == NotificationType.Mention &&
                    x.PostId == postId &&
                    x.ActorUserId == actorUserId &&
                    distinctRecipients.Contains(x.RecipientUserId))
                .Select(x => x.RecipientUserId)
                .ToListAsync(cancellationToken);

            var existingSet = existingRecipients.ToHashSet();
            var notifications = new List<UserNotification>();

            foreach (var recipientUserId in distinctRecipients)
            {
                if (existingSet.Contains(recipientUserId))
                {
                    continue;
                }

                if (await _userModerationService.IsBlockedEitherWayAsync(actorUserId, recipientUserId, cancellationToken))
                {
                    continue;
                }

                notifications.Add(CreateNotification(actorUserId, recipientUserId, NotificationType.Mention, postId));
            }

            if (notifications.Count == 0)
            {
                return;
            }

            _dbContext.UserNotifications.AddRange(notifications);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task RemoveRelationshipNotificationsAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default)
        {
            await _dbContext.UserNotifications
                .Where(x =>
                    x.Category == NotificationCategory.Social &&
                    (
                        (x.ActorUserId == currentUserId && x.RecipientUserId == targetUserId) ||
                        (x.ActorUserId == targetUserId && x.RecipientUserId == currentUserId)
                    ))
                .ExecuteDeleteAsync(cancellationToken);
        }

        private async Task CreateNotificationAsync(
            Guid actorUserId,
            Guid recipientUserId,
            NotificationType type,
            Guid? postId,
            CancellationToken cancellationToken)
        {
            if (actorUserId == recipientUserId)
            {
                return;
            }

            if (await _userModerationService.IsBlockedEitherWayAsync(actorUserId, recipientUserId, cancellationToken))
            {
                return;
            }

            _dbContext.UserNotifications.Add(CreateNotification(actorUserId, recipientUserId, type, postId));
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        private async Task<bool> HasExistingAsync(
            Guid actorUserId,
            Guid recipientUserId,
            NotificationType type,
            Guid? postId,
            CancellationToken cancellationToken)
        {
            return await _dbContext.UserNotifications
                .AsNoTracking()
                .AnyAsync(x =>
                    x.ActorUserId == actorUserId &&
                    x.RecipientUserId == recipientUserId &&
                    x.Type == type &&
                    x.PostId == postId, cancellationToken);
        }

        private static UserNotification CreateNotification(Guid actorUserId, Guid recipientUserId, NotificationType type, Guid? postId)
        {
            return new UserNotification
            {
                ActorUserId = actorUserId,
                RecipientUserId = recipientUserId,
                Type = type,
                Category = NotificationCategory.Social,
                PostId = postId,
                CreatedAt = DateTime.UtcNow
            };
        }

        private static NotificationItemDto MapToDto(UserNotification entity)
        {
            return new NotificationItemDto
            {
                Id = entity.Id,
                Type = entity.Type.ToString().ToLowerInvariant(),
                Category = entity.Category.ToString().ToLowerInvariant(),
                IsRead = entity.IsRead,
                CreatedAt = entity.CreatedAt,
                Actor = entity.ActorUser == null
                    ? null
                    : new NotificationActorDto
                    {
                        Id = entity.ActorUser.Id,
                        Username = entity.ActorUser.Username,
                        AvatarUrl = entity.ActorUser.AvatarUrl
                    },
                PostId = entity.PostId,
                PostPreview = BuildPostPreview(entity.Post)
            };
        }

        private static string? BuildPostPreview(UserPost? post)
        {
            if (post == null)
            {
                return null;
            }

            if (!string.IsNullOrWhiteSpace(post.TextContent))
            {
                return Truncate(post.TextContent.Trim(), 140);
            }

            if (post.Activity == null || string.IsNullOrWhiteSpace(post.Activity.PayloadJson))
            {
                return null;
            }

            try
            {
                using var document = JsonDocument.Parse(post.Activity.PayloadJson);
                var root = document.RootElement;

                foreach (var propertyName in new[] { "title", "showName", "Title", "ShowName" })
                {
                    if (root.TryGetProperty(propertyName, out var property) && property.ValueKind == JsonValueKind.String)
                    {
                        return Truncate(property.GetString(), 140);
                    }
                }
            }
            catch
            {
                return null;
            }

            return null;
        }

        private static string? Truncate(string? value, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return null;
            }

            return value.Length <= maxLength
                ? value
                : $"{value[..(maxLength - 3)].TrimEnd()}...";
        }

        private async Task<HashSet<Guid>> GetHiddenActorIdsAsync(Guid currentUserId, CancellationToken cancellationToken)
        {
            var blockedIds = await _userModerationService.GetBlockedOrBlockingUserIdsAsync(currentUserId, cancellationToken);
            var mutedIds = await _userModerationService.GetMutedUserIdsAsync(currentUserId, cancellationToken);
            return blockedIds.Concat(mutedIds).ToHashSet();
        }
    }
}
