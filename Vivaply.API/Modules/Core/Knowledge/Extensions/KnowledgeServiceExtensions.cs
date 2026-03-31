using Vivaply.API.Modules.Core.Knowledge.Services.Implementations;
using Vivaply.API.Modules.Core.Knowledge.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Knowledge.Extensions
{
    public static class KnowledgeServiceExtensions
    {
        public static IServiceCollection AddKnowledgeServices(
            this IServiceCollection services)
        {
            // Domain services
            services.AddScoped<IBookService, BookService>();

            // Google Books API client
            services.AddHttpClient<IGoogleBooksService, GoogleBooksService>(client =>
            {
                client.BaseAddress = new Uri("https://www.googleapis.com/books/v1/");
                client.DefaultRequestHeaders.Add("Accept", "application/json");
            });

            return services;
        }
    }
}
