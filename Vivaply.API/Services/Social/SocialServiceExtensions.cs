
using Vivaply.API.Services.Social.Follow;

namespace Vivaply.API.Services.Social
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
