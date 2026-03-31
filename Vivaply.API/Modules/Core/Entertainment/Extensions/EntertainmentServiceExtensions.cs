using Vivaply.API.Modules.Core.Entertainment.Services.Implementations;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Extensions
{
    public static class EntertainmentServiceExtensions
    {
        public static IServiceCollection AddEntertainmentServices(this IServiceCollection services)
        {
            services.AddScoped<IMediaService, MediaService>();
            services.AddScoped<IGameService, GameService>();
            services.AddScoped<IDiscoveryService, DiscoveryService>();

            services.AddHttpClient<ITmdbService, TmdbService>(client =>
            {
                client.BaseAddress = new Uri("https://api.themoviedb.org/3/");
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            services.AddHttpClient<IIgdbService, IgdbService>(client =>
            {
                client.BaseAddress = new Uri("https://api.igdb.com/v4/");
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            services.AddScoped<IRecommendationService, RecommendationService>();

            return services;
        }
    }
}
