namespace Vivaply.API.Entities.Identity
{
    public class PostMention
    {
        public Guid Id { get; set; }

        public Guid PostId { get; set; }
        public UserPost? Post { get; set; }

        public Guid MentionedUserId { get; set; }
        public User? MentionedUser { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
