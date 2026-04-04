using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Posts
{
    public class PostAttachmentDto
    {
        public Guid Id { get; set; }
        public PostAttachmentType Type { get; set; }
        public string Url { get; set; } = string.Empty;
        public string? ThumbnailUrl { get; set; }
        public int SortOrder { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? DurationSeconds { get; set; }
    }
}
