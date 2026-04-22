namespace Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts
{
    public class CreatePostRequest
    {
        public string? TextContent { get; set; }
        public bool IsSpoiler { get; set; }
        public List<IFormFile>? Files { get; set; }
    }
}
