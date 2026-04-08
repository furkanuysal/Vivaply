using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class PostLikeConfiguration : IEntityTypeConfiguration<PostLike>
    {
        public void Configure(EntityTypeBuilder<PostLike> builder)
        {
            builder.HasOne(x => x.Post)
                .WithMany(x => x.Likes)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PostId, x.UserId })
                .IsUnique();
            builder.HasIndex(x => x.UserId);
        }
    }
}
