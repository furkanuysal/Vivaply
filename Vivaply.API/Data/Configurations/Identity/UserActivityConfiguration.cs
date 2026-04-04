using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class UserActivityConfiguration : IEntityTypeConfiguration<UserActivity>
    {
        public void Configure(EntityTypeBuilder<UserActivity> builder)
        {
            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Property(x => x.PayloadJson)
                .HasColumnType("text");

            builder.HasOne(x => x.Post)
                .WithOne(x => x.Activity)
                .HasForeignKey<UserPost>(x => x.ActivityId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.OccurredAt });
            builder.HasIndex(x => x.OccurredAt);
            builder.HasIndex(x => x.AggregateKey);
            builder.HasIndex(x => new { x.SourceEntityType, x.SourceEntityId });
        }
    }
}
