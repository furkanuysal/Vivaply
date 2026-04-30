namespace Vivaply.API.Modules.Core.Notifications.DTOs.Queries
{
    public class NotificationQuery
    {
        public bool UnreadOnly { get; set; }
        public int Take { get; set; } = 30;
    }
}
