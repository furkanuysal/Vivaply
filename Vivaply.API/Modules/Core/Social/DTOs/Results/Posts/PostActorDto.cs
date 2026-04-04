namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostActorDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }
}
