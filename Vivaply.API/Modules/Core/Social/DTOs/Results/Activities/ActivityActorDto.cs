namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Activities
{
    public class ActivityActorDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
