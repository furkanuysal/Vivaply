using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class PostMentionConfiguration : IEntityTypeConfiguration<PostMention>
    {
        public void Configure(EntityTypeBuilder<PostMention> builder)
        {
            builder.HasOne(x => x.Post)
                .WithMany(x => x.Mentions)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.MentionedUser)
                .WithMany(x => x.MentionedInPosts)
                .HasForeignKey(x => x.MentionedUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PostId, x.MentionedUserId })
                .IsUnique();

            builder.HasIndex(x => new { x.MentionedUserId, x.CreatedAt });
        }
    }
}
