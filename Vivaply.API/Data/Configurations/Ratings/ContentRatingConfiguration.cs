using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Ratings;

namespace Vivaply.API.Data.Configurations.Ratings
{
    public class ContentRatingConfiguration : IEntityTypeConfiguration<ContentRating>
    {
        public void Configure(EntityTypeBuilder<ContentRating> builder)
        {
            builder.Property(x => x.SourceId)
                .HasMaxLength(128);

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.SourceType, x.SourceId })
                .IsUnique();

            builder.HasIndex(x => new { x.SourceType, x.SourceId });
        }
    }
}
