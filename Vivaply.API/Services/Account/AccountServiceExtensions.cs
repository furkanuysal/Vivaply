using Vivaply.API.Services.Account.Images;

namespace Vivaply.API.Services.Account
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
