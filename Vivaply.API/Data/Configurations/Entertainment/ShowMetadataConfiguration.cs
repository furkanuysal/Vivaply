using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment.Tmdb;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class ShowMetadataConfiguration : IEntityTypeConfiguration<ShowMetadata>
    {
        public void Configure(EntityTypeBuilder<ShowMetadata> builder)
        {
            builder.HasKey(x => x.TmdbShowId);
        }
    }
}
