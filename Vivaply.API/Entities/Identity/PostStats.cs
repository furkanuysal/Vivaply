namespace Vivaply.API.Entities.Identity
{
    public class PostStats
    {
        public Guid PostId { get; set; }
        public UserPost? Post { get; set; }

        public int ReplyCount { get; set; }
        public int LikeCount { get; set; }
        public int QuoteCount { get; set; }
        public int ViewCount { get; set; }
        public int BookmarkCount { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
