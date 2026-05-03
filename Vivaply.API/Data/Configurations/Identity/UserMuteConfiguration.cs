using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class UserMuteConfiguration : IEntityTypeConfiguration<UserMute>
    {
        public void Configure(EntityTypeBuilder<UserMute> builder)
        {
            builder.HasOne(x => x.Muter)
                .WithMany(x => x.MutedUsers)
                .HasForeignKey(x => x.MuterId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Muted)
                .WithMany(x => x.MutedByUsers)
                .HasForeignKey(x => x.MutedId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.MuterId, x.MutedId })
                .IsUnique();

            builder.HasIndex(x => new { x.MutedId, x.CreatedAt });
        }
    }
}
