using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Modules.Core.Identity.Services.Interfaces
{
    public interface ITokenService
    {
        string CreateAccessToken(User user);
        string CreateRefreshToken();
    }
}
