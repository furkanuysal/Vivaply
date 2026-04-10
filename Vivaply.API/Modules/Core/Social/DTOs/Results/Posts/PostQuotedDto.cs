using Vivaply.API.Modules.Core.Social.DTOs.Results.Activities;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostQuotedDto
    {
        public Guid Id { get; set; }
        public PostActorDto Actor { get; set; } = new();
        public PostType Type { get; set; }
        public DateTime PublishedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? TextContent { get; set; }
        public ActivityDto? Activity { get; set; }
        public List<PostAttachmentDto> Attachments { get; set; } = [];
    }
}
