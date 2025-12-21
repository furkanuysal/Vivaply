using Vivaply.API.Services.Entertainment.Discovery;
using Vivaply.API.Services.Entertainment.Game;
using Vivaply.API.Services.Entertainment.Igdb;
using Vivaply.API.Services.Entertainment.Media;
using Vivaply.API.Services.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment
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

            return services;
        }
    }
}
