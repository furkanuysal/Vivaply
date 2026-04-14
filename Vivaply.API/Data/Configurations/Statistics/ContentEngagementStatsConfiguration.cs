using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Statistics;

namespace Vivaply.API.Data.Configurations.Statistics
{
    public class ContentEngagementStatsConfiguration : IEntityTypeConfiguration<ContentEngagementStats>
    {
        public void Configure(EntityTypeBuilder<ContentEngagementStats> builder)
        {
            builder.Property(x => x.SourceId)
                .HasMaxLength(128);

            builder.HasIndex(x => new { x.SourceType, x.SourceId })
                .IsUnique();
        }
    }
}
