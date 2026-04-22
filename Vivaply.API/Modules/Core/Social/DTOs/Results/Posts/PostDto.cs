using Vivaply.API.Modules.Core.Social.DTOs.Results.Activities;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostDto
    {
        public Guid Id { get; set; }
        public PostActorDto Actor { get; set; } = new();
        public PostType Type { get; set; }
        public DateTime PublishedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? TextContent { get; set; }
        public bool IsSpoiler { get; set; }
        public Guid? ParentPostId { get; set; }
        public Guid? QuotedPostId { get; set; }
        public PostQuotedDto? QuotedPost { get; set; }
        public ActivityDto? Activity { get; set; }
        public List<PostAttachmentDto> Attachments { get; set; } = [];
        public List<PostReplyDto> Replies { get; set; } = [];
        public PostStatsDto Stats { get; set; } = new();
        public PostViewerStateDto Viewer { get; set; } = new();
    }
}
