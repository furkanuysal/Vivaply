using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Entertainment.Tmdb
{
    public class MovieMetadata
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int TmdbMovieId { get; set; }

        [MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PosterPath { get; set; }

        public double VoteAverage { get; set; }

        [MaxLength(50)]
        public string? ProductionStatus { get; set; }

        public DateTime? ReleaseDate { get; set; }

        [Column(TypeName = "jsonb")]
        public string? GenresJson { get; set; }

        public DateTime LastFetchedAt { get; set; }
    }
}
