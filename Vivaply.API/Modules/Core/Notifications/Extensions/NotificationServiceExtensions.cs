using Vivaply.API.Modules.Core.Notifications.Services.Implementations;
using Vivaply.API.Modules.Core.Notifications.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Notifications.Extensions
{
    public static class NotificationServiceExtensions
    {
        public static IServiceCollection AddNotificationServices(this IServiceCollection services)
        {
            services.AddScoped<INotificationService, NotificationService>();
            return services;
        }
    }
}
