using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Knowledge
{
    public class BookMetadata
    {
        [Key]
        [MaxLength(50)]
        public string GoogleBookId { get; set; } = string.Empty;

        [MaxLength(500)]
        public string Title { get; set; } = string.Empty;

        [Column(TypeName = "jsonb")]
        public string? AuthorsJson { get; set; }

        [MaxLength(500)]
        public string? CoverUrl { get; set; }

        public int PageCount { get; set; }

        public DateTime LastFetchedAt { get; set; }
    }
}
