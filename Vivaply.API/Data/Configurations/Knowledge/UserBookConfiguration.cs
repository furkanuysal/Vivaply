using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.Data.Configurations.Knowledge
{
    public class UserBookConfiguration : IEntityTypeConfiguration<UserBook>
    {
        public void Configure(EntityTypeBuilder<UserBook> builder)
        {
            builder.HasOne(b => b.User)
                .WithMany()
                .HasForeignKey(b => b.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.UserId, x.GoogleBookId })
                .IsUnique();

            builder.HasOne(b => b.Metadata)
                .WithMany()
                .HasForeignKey(b => b.GoogleBookId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
