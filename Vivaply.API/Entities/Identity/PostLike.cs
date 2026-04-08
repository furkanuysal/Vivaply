namespace Vivaply.API.Entities.Identity
{
    public class PostLike
    {
        public Guid Id { get; set; }

        public Guid PostId { get; set; }
        public UserPost? Post { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
