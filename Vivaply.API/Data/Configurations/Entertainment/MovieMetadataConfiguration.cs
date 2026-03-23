using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment.Tmdb;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class MovieMetadataConfiguration : IEntityTypeConfiguration<MovieMetadata>
    {
        public void Configure(EntityTypeBuilder<MovieMetadata> builder)
        {
            builder.HasKey(x => x.TmdbMovieId);
        }
    }
}
