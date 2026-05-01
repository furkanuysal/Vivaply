using Vivaply.API.Modules.Core.Notifications.DTOs.Queries;
using Vivaply.API.Modules.Core.Notifications.DTOs.Results;

namespace Vivaply.API.Modules.Core.Notifications.Services.Interfaces
{
    public interface INotificationService
    {
        Task<NotificationListDto> GetAsync(Guid currentUserId, NotificationQuery query, CancellationToken cancellationToken = default);
        Task<NotificationUnreadCountDto> GetUnreadCountAsync(Guid currentUserId, CancellationToken cancellationToken = default);
        Task<bool> MarkAsReadAsync(Guid currentUserId, Guid notificationId, CancellationToken cancellationToken = default);
        Task<int> MarkAllAsReadAsync(Guid currentUserId, CancellationToken cancellationToken = default);
        Task CreateFollowNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default);
        Task CreateFollowRequestNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default);
        Task CreateFollowAcceptedNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default);
        Task RemoveFollowRequestNotificationAsync(Guid actorUserId, Guid recipientUserId, CancellationToken cancellationToken = default);
        Task CreateLikeNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default);
        Task RemoveLikeNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default);
        Task CreateReplyNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default);
        Task CreateQuoteNotificationAsync(Guid actorUserId, Guid recipientUserId, Guid postId, CancellationToken cancellationToken = default);
        Task CreateMentionNotificationsAsync(Guid actorUserId, Guid postId, IReadOnlyCollection<Guid> recipientUserIds, CancellationToken cancellationToken = default);
    }
}
