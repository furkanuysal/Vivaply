using System.ComponentModel.DataAnnotations;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Entities.Identity
{
    public class UserPost
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public PostType Type { get; set; }

        public Guid? ActivityId { get; set; }
        public UserActivity? Activity { get; set; }

        public Guid? ParentPostId { get; set; }
        public UserPost? ParentPost { get; set; }

        public Guid? QuotedPostId { get; set; }
        public UserPost? QuotedPost { get; set; }

        [MaxLength(4000)]
        public string? TextContent { get; set; }

        public bool IsSpoiler { get; set; }

        [MaxLength(200)]
        public string? LocationName { get; set; }
        public double? LocationLat { get; set; }
        public double? LocationLon { get; set; }

        public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public bool IsDeleted { get; set; }
        public DateTime? DeletedAt { get; set; }

        public ICollection<PostAttachment> Attachments { get; set; } = new List<PostAttachment>();
        public ICollection<UserPost> Replies { get; set; } = new List<UserPost>();
        public ICollection<UserPost> Quotes { get; set; } = new List<UserPost>();
        public ICollection<PostMention> Mentions { get; set; } = new List<PostMention>();
        public ICollection<PostLike> Likes { get; set; } = new List<PostLike>();
        public ICollection<PostBookmark> Bookmarks { get; set; } = new List<PostBookmark>();
        public PostStats? Stats { get; set; }
    }
}
