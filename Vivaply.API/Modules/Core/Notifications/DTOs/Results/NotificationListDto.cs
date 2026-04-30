namespace Vivaply.API.Modules.Core.Notifications.DTOs.Results
{
    public class NotificationListDto
    {
        public List<NotificationItemDto> Items { get; set; } = [];
        public int UnreadCount { get; set; }
    }
}
