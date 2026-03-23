using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Entertainment;

namespace Vivaply.API.Data.Configurations.Entertainment
{
    public class UserMovieConfiguration : IEntityTypeConfiguration<UserMovie>
    {
        public void Configure(EntityTypeBuilder<UserMovie> builder)
        {
            builder.HasOne(m => m.User)
                .WithMany()
                .HasForeignKey(m => m.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.TmdbMovieId })
                .IsUnique();

            builder.HasOne(m => m.Metadata)
                .WithMany()
                .HasForeignKey(m => m.TmdbMovieId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
