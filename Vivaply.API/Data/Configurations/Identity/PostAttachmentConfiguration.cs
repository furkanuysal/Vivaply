using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class PostAttachmentConfiguration : IEntityTypeConfiguration<PostAttachment>
    {
        public void Configure(EntityTypeBuilder<PostAttachment> builder)
        {
            builder.HasOne(x => x.Post)
                .WithMany(x => x.Attachments)
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.PostId, x.SortOrder });
        }
    }
}
