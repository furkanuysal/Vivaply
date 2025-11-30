using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Entities.Finance
{
    public class Wallet
    {
        [Key]
        [ForeignKey("User")]
        public Guid UserId { get; set; }

        // User balance
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0;

        // Balance that is locked (e.g., pending transactions)
        [Column(TypeName = "decimal(18,2)")]
        public decimal LockedBalance { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Concurrency token for optimistic concurrency control
        [ConcurrencyCheck]
        public byte[] RowVersion { get; set; } = [];

        public User? User { get; set; }
    }
}
