namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Follows
{
    public class FollowUserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public bool IsFollowingCurrentUser { get; set; }
    }
}
