using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class UserShowConfiguration : IEntityTypeConfiguration<UserShow>
    {
        public void Configure(EntityTypeBuilder<UserShow> builder)
        {
            builder.HasMany(s => s.WatchedEpisodes)
                .WithOne(e => e.UserShow)
                .HasForeignKey(e => e.UserShowId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.TmdbShowId })
                .IsUnique();

            builder.HasOne(s => s.Metadata)
                .WithMany()
                .HasForeignKey(s => s.TmdbShowId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
