using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Vivaply.API.Entities.Entertainment.Tmdb
{
    public class ShowMetadata
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int TmdbShowId { get; set; }

        [MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? PosterPath { get; set; }

        public double VoteAverage { get; set; }

        [MaxLength(50)]
        public string? ProductionStatus { get; set; }

        public DateTime? FirstAirDate { get; set; }

        public int? LastKnownSeason { get; set; }
        public int? LastKnownEpisode { get; set; }

        public DateTime? NextEpisodeAirDate { get; set; }

        public string? GenresJson { get; set; }

        public DateTime LastFetchedAt { get; set; }
    }
}
