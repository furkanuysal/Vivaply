using Vivaply.API.Modules.Core.Social.Services.Implementations;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Extensions
{
    public static class SocialServiceExtensions
    {
        public static IServiceCollection AddSocialServices(this IServiceCollection services)
        {
            services.AddScoped<IFollowService, FollowService>();

            return services;
        }
    }
}
