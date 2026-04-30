namespace Vivaply.API.Modules.Core.Notifications.DTOs.Results
{
    public class NotificationItemDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime CreatedAt { get; set; }
        public NotificationActorDto? Actor { get; set; }
        public Guid? PostId { get; set; }
        public string? PostPreview { get; set; }
    }
}
