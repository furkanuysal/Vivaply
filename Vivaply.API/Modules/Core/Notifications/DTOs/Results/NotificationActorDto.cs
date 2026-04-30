namespace Vivaply.API.Modules.Core.Notifications.DTOs.Results
{
    public class NotificationActorDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
