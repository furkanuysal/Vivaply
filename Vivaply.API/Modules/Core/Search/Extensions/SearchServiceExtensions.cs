using Vivaply.API.Modules.Core.Search.Services.Implementations;
using Vivaply.API.Modules.Core.Search.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Search.Extensions
{
    public static class SearchServiceExtensions
    {
        public static IServiceCollection AddSearchServices(this IServiceCollection services)
        {
            services.AddScoped<ISearchService, SearchService>();
            return services;
        }
    }
}
