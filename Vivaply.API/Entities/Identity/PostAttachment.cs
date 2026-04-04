using System.ComponentModel.DataAnnotations;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Entities.Identity
{
    public class PostAttachment
    {
        public Guid Id { get; set; }

        public Guid PostId { get; set; }
        public UserPost? Post { get; set; }

        public PostAttachmentType Type { get; set; }

        [MaxLength(2048)]
        public string Url { get; set; } = string.Empty;

        [MaxLength(2048)]
        public string? ThumbnailUrl { get; set; }

        public int SortOrder { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public int? DurationSeconds { get; set; }
    }
}
