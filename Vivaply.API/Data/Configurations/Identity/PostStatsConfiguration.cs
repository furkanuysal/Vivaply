using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class PostStatsConfiguration : IEntityTypeConfiguration<PostStats>
    {
        public void Configure(EntityTypeBuilder<PostStats> builder)
        {
            builder.HasKey(x => x.PostId);

            builder.HasOne(x => x.Post)
                .WithOne(x => x.Stats)
                .HasForeignKey<PostStats>(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
