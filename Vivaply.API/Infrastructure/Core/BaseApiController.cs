using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Vivaply.API.Infrastructure.Core
{
    [ApiController]
    public abstract class BaseApiController : ControllerBase
    {
        protected Guid CurrentUserId
        {
            get
            {
                var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (!Guid.TryParse(userIdString, out var userId))
                    throw new UnauthorizedAccessException();

                return userId;
            }
        }
    }
}
