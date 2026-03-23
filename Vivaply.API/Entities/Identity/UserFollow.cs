using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.Entities.Identity
{
    [Index(nameof(FollowerId))]
    [Index(nameof(FollowingId))]
    [Index(nameof(FollowerId), nameof(FollowingId), IsUnique = true)]
    public class UserFollow
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid FollowerId { get; set; }

        [Required]
        public Guid FollowingId { get; set; }

        public FollowStatus Status { get; set; } = FollowStatus.Pending;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? RespondedAt { get; set; }

        public User Follower { get; set; } = null!;
        public User Following { get; set; } = null!;
    }
}