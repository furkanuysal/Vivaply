using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Data.Configurations.Identity
{
    public class UserNotificationConfiguration : IEntityTypeConfiguration<UserNotification>
    {
        public void Configure(EntityTypeBuilder<UserNotification> builder)
        {
            builder.HasOne(x => x.RecipientUser)
                .WithMany(x => x.Notifications)
                .HasForeignKey(x => x.RecipientUserId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.ActorUser)
                .WithMany(x => x.SentNotifications)
                .HasForeignKey(x => x.ActorUserId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(x => x.Post)
                .WithMany()
                .HasForeignKey(x => x.PostId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasIndex(x => new { x.RecipientUserId, x.IsRead, x.CreatedAt });
            builder.HasIndex(x => new { x.RecipientUserId, x.Type, x.PostId });
        }
    }
}
