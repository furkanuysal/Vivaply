using Vivaply.API.Services.Entertainment.Discovery;
using Vivaply.API.Services.Entertainment.Media;

namespace Vivaply.API.Services.Entertainment
{
    public static class EntertainmentServiceExtensions
    {
        public static IServiceCollection AddEntertainmentServices(this IServiceCollection services)
        {
            services.AddScoped<IMediaService, MediaService>();
            services.AddScoped<IDiscoveryService, DiscoveryService>();
            return services;
        }
    }
}
