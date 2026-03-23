using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment.Igdb;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class GameMetadataConfiguration : IEntityTypeConfiguration<GameMetadata>
    {
        public void Configure(EntityTypeBuilder<GameMetadata> builder)
        {
            builder.HasKey(x => x.IgdbId);
        }
    }
}
