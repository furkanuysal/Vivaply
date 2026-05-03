using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class UserBlockConfiguration : IEntityTypeConfiguration<UserBlock>
    {
        public void Configure(EntityTypeBuilder<UserBlock> builder)
        {
            builder.HasOne(x => x.Blocker)
                .WithMany(x => x.BlockedUsers)
                .HasForeignKey(x => x.BlockerId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Blocked)
                .WithMany(x => x.BlockedByUsers)
                .HasForeignKey(x => x.BlockedId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.BlockerId, x.BlockedId })
                .IsUnique();

            builder.HasIndex(x => new { x.BlockedId, x.CreatedAt });
        }
    }
}
