using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Knowledge.Enums;

namespace Vivaply.API.Entities.Knowledge
{
    public class UserBook
    {
        public Guid Id { get; set; }

        public Guid UserId { get; set; }
        public User? User { get; set; }

        // Google Books ID (String value, example: "zyTCAlFPjgYC")
        [MaxLength(50)]
        public string GoogleBookId { get; set; } = string.Empty;
        public BookMetadata? Metadata { get; set; }

        // User-specific fields
        public ReadStatus Status { get; set; } = ReadStatus.PlanToRead;

        public int CurrentPage { get; set; } = 0; // The page where the user left off

        [Range(0, 10)]
        public double? UserRating { get; set; } // User rating from 1 to 10

        [MaxLength(2000)]
        public string? Review { get; set; } // Personal review by the user

        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        public DateTime? DateFinished { get; set; }
    }
}
