using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Services
{
    public interface ITokenService
    {
        string CreateToken(User user);
    }
}
