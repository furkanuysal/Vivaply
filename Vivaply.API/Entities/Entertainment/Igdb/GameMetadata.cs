using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Entertainment.Igdb
{
    public class GameMetadata
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int IgdbId { get; set; }

        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? CoverUrl { get; set; }

        public DateTime? ReleaseDate { get; set; }

        [Column(TypeName = "jsonb")]
        public string? PlatformsJson { get; set; }

        [Column(TypeName = "jsonb")]
        public string? DevelopersJson { get; set; }

        [Column(TypeName = "jsonb")]
        public string? GenresJson { get; set; }

        // Normalize to 0-10 scale here
        public double VoteAverage { get; set; }

        public DateTime LastFetchedAt { get; set; }
    }
}
