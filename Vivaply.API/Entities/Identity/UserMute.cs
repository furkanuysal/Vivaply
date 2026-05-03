namespace Vivaply.API.Entities.Identity
{
    public class UserMute
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public Guid MuterId { get; set; }
        public Guid MutedId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public User? Muter { get; set; }
        public User? Muted { get; set; }
    }
}
