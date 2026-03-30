using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Controllers
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
