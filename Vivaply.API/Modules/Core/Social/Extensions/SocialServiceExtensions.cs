using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Social.Services.Implementations;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Extensions
{
    public static class SocialServiceExtensions
    {
        public static IServiceCollection AddSocialServices(this IServiceCollection services)
        {
            services.AddScoped<IFollowService, FollowService>();
            services.AddScoped<IActivityService, ActivityService>();
            services.AddScoped<ActivityEventHandler>();
            RegisterEventHandler<ActivityEventHandler>(services);

            return services;
        }

        private static void RegisterEventHandler<THandler>(IServiceCollection services)
            where THandler : class
        {
            var handlerType = typeof(THandler);

            foreach (var serviceType in handlerType.GetInterfaces()
                .Where(x =>
                    x.IsGenericType &&
                    x.GetGenericTypeDefinition() == typeof(IApplicationEventHandler<>)))
            {
                services.AddScoped(serviceType, sp => sp.GetRequiredService<THandler>());
            }
        }
    }
}
