using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Vivaply.API.Data;
using Vivaply.API.DTOs;

namespace Vivaply.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : ControllerBase
    {
        private readonly VivaplyDbContext _context;

        public ProfileController(VivaplyDbContext context)
        {
            _context = context;
        }

        // [Authorize]: If the user is not authenticated, they cannot access this endpoint.
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetMyProfile()
        {
            // Get the user ID from the JWT token claims
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !Guid.TryParse(userIdString, out var userId))
            {
                return Unauthorized();
            }

            // Get the user from the database
            // Get related Profile and Wallet data as well
            var user = await _context.Users
                .Include(u => u.Profile)
                .Include(u => u.Wallet)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null) return NotFound("Kullanıcı bulunamadı.");

            // Using the UserProfileDto to shape the response
            var response = new UserProfileDto
            (
                user.Username,
                user.Email,
                user.Profile?.Level ?? 1,      // Default level is 1 if Profile is null
                user.Profile?.CurrentXp ?? 0,
                user.Profile?.TotalXp ?? 0,
                user.Wallet?.Balance ?? 0,     // Default balance is 0 if Wallet is null
                user.Profile?.CurrentStreak ?? 0
            );

            return Ok(response);
        }
    }
}