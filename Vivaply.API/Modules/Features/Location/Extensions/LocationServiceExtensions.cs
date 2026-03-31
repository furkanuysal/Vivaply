using Vivaply.API.Modules.Features.Location.Services.Implementations;
using Vivaply.API.Modules.Features.Location.Services.Interfaces;

namespace Vivaply.API.Modules.Features.Location.Extensions
{
    public static class LocationServiceExtensions
    {
        public static IServiceCollection AddLocationServices(
        this IServiceCollection services)
        {
            services.AddHttpClient<INominatimService, NominatimService>(client =>
            {
                client.BaseAddress = new Uri("https://nominatim.openstreetmap.org/");
                client.DefaultRequestHeaders.UserAgent.ParseAdd(
                    "Vivaply (contact@vivaply.com)"
                );
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            return services;
        }
    }
}
