using Vivaply.API.Modules.Core.Identity.Services.Implementations;
using Vivaply.API.Modules.Core.Identity.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Identity.Extensions
{
    public static class AccountServiceExtensions
    {
        public static IServiceCollection AddAccountServices(this IServiceCollection services)
        {
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IImageService, ImageService>();

            return services;
        }
    }
}
