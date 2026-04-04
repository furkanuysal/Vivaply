namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostFeedDto
    {
        public List<PostDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
