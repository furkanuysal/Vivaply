using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Ratings;

namespace Vivaply.API.Data.Configurations.Ratings
{
    public class ContentRatingStatsConfiguration : IEntityTypeConfiguration<ContentRatingStats>
    {
        public void Configure(EntityTypeBuilder<ContentRatingStats> builder)
        {
            builder.Property(x => x.SourceId)
                .HasMaxLength(128);

            builder.HasIndex(x => new { x.SourceType, x.SourceId })
                .IsUnique();
        }
    }
}
