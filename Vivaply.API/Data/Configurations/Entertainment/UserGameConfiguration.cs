using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment.Igdb;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class UserGameConfiguration : IEntityTypeConfiguration<UserGame>
    {
        public void Configure(EntityTypeBuilder<UserGame> builder)
        {
            builder.HasOne(g => g.User)
                .WithMany()
                .HasForeignKey(g => g.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.IgdbId })
                .IsUnique();

            builder.HasOne(g => g.Metadata)
                .WithMany()
                .HasForeignKey(g => g.IgdbId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
