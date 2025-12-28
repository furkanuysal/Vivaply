using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Identity
{
    public class UserRefreshToken
    {
        public Guid Id { get; set; }

        [Required]
        public string TokenHash { get; set; } = string.Empty; // Hashed token

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } // Refresh token expiration date

        public DateTime? RevokedAt { get; set; } // Logout or token revocation date
        public string? RevokedByIp { get; set; }
        public string? ReplacedByTokenHash { get; set; } // Token replacement (rotation)

        public bool IsActive => RevokedAt == null && DateTime.UtcNow < ExpiresAt;

        // Foreign Key
        public Guid UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; } = null!;
    }
}