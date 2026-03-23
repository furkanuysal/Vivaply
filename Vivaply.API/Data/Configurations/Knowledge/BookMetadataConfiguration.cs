using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.Data.Configurations.Knowledge
{
    public class BookMetadataConfiguration : IEntityTypeConfiguration<BookMetadata>
    {
        public void Configure(EntityTypeBuilder<BookMetadata> builder)
        {
            builder.HasKey(x => x.GoogleBookId);
        }
    }
}
