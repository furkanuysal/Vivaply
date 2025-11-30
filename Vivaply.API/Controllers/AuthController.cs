using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs;
using Vivaply.API.Entities.Finance;
using Vivaply.API.Entities.Gamification;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Services;

namespace Vivaply.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly VivaplyDbContext _context;
        private readonly ITokenService _tokenService;

        public AuthController(VivaplyDbContext context, ITokenService tokenService)
        {
            _context = context;
            _tokenService = tokenService;
        }

        // Register
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterDto request)
        {
            // Validation (Check if email or username already exists)
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest("Bu email adresi zaten kullanılıyor.");

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest("Bu kullanıcı adı zaten alınmış.");

            // Hash the password for security
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            // Create the main User entity
            var newUser = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                CreatedAt = DateTime.UtcNow
            };

            // Create related entities with default values
            var newProfile = new UserProfile
            {
                UserId = newUser.Id,
                Level = 1,
                CurrentXp = 0,
                TotalXp = 0,
                CurrentStreak = 0,
                LongestStreak = 0
            };

            var newWallet = new Wallet
            {
                UserId = newUser.Id,
                Balance = 0,
                LockedBalance = 0,
                RowVersion = Guid.NewGuid().ToByteArray()
            };

            var newPreferences = new UserPreferences
            {
                UserId = newUser.Id,
                TimeZone = "UTC"
            };

            // Add entities to the context
            _context.Users.Add(newUser);
            _context.UserProfiles.Add(newProfile);
            _context.Wallets.Add(newWallet);
            _context.UserPreferences.Add(newPreferences);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Kayıt başarılı! Hoş geldin." });
        }

        // Login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDto request)
        {
            // Different ways to identify user: by email or username
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Identifier || u.Username == request.Identifier);

            // If user not found
            if (user == null)
            {
                // For security reasons, do not reveal whether the username/email or password was incorrect
                return Unauthorized("Kullanıcı adı veya şifre hatalı.");
            }

            // Password verification
            // Check the hashed password
            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!isPasswordValid)
            {
                return Unauthorized("Kullanıcı adı veya şifre hatalı.");
            }

            var token = _tokenService.CreateToken(user);

            return Ok(new
            {
                token,
                username = user.Username,
                userId = user.Id,
                message = "Giriş başarılı!"
            });
        }
    }
}