using System.ComponentModel.DataAnnotations;
using Vivaply.API.Entities.Identity;

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

        // Cached Book Data
        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Authors { get; set; } = string.Empty; // String values separated by commas

        [MaxLength(500)]
        public string? CoverUrl { get; set; }

        public int PageCount { get; set; } // Total Pages

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
