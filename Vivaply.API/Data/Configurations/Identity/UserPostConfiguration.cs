using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class UserPostConfiguration : IEntityTypeConfiguration<UserPost>
    {
        public void Configure(EntityTypeBuilder<UserPost> builder)
        {
            builder.Property(x => x.LocationName)
                .HasMaxLength(200);

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Activity)
                .WithOne(x => x.Post)
                .HasForeignKey<UserPost>(x => x.ActivityId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.ParentPost)
                .WithMany(x => x.Replies)
                .HasForeignKey(x => x.ParentPostId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.QuotedPost)
                .WithMany(x => x.Quotes)
                .HasForeignKey(x => x.QuotedPostId)
                .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(x => new { x.UserId, x.PublishedAt });
            builder.HasIndex(x => x.PublishedAt);
            builder.HasIndex(x => x.ActivityId)
                .IsUnique();
            builder.HasIndex(x => x.ParentPostId);
            builder.HasIndex(x => x.QuotedPostId);
            builder.HasIndex(x => new { x.TextContent })
                .HasMethod("gin")
                .IsTsVectorExpressionIndex("simple");
        }
    }
}
