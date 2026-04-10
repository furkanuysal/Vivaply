using Vivaply.API.Modules.Core.Ratings.Services.Implementations;
using Vivaply.API.Modules.Core.Ratings.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Ratings.Extensions
{
    public static class RatingServiceExtensions
    {
        public static IServiceCollection AddRatingServices(this IServiceCollection services)
        {
            services.AddScoped<IContentRatingService, ContentRatingService>();
            return services;
        }
    }
}
