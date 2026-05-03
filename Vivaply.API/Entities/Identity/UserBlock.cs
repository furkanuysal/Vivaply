namespace Vivaply.API.Entities.Identity
{
    public class UserBlock
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid BlockerId { get; set; }
        public Guid BlockedId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? Blocker { get; set; }
        public User? Blocked { get; set; }
    }
}
