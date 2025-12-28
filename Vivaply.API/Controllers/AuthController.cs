using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;
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
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == request.Identifier || u.Username == request.Identifier);

            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return Unauthorized("Kullanıcı adı veya şifre hatalı.");
            }

            // Create Tokens
            var accessToken = _tokenService.CreateAccessToken(user);
            var refreshToken = _tokenService.CreateRefreshToken();

            // Hash and save Refresh Token in DB
            await SaveRefreshTokenAsync(user, refreshToken);

            // Send Refresh Token as HttpOnly Cookie
            SetRefreshTokenCookie(refreshToken);

            // Send Access Token in response body
            return Ok(new
            {
                accessToken,
                username = user.Username,
                userId = user.Id,
                message = "Giriş başarılı!"
            });
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken()
        {
            // Read Refresh Token from HttpOnly Cookie
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized("Token bulunamadı.");

            // Hash the received token
            var hashedToken = HashToken(refreshToken);

            // Does the token exist in DB and is active?
            var userRefreshToken = await _context.UserRefreshTokens
                .Include(rt => rt.User)
                .FirstOrDefaultAsync(rt => rt.TokenHash == hashedToken);

            if (userRefreshToken == null || !userRefreshToken.IsActive)
                return Unauthorized("Geçersiz oturum.");

            // Token rotation
            userRefreshToken.RevokedAt = DateTime.UtcNow;
            userRefreshToken.RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString();

            // Create new tokens
            var newAccessToken = _tokenService.CreateAccessToken(userRefreshToken.User);
            var newRefreshToken = _tokenService.CreateRefreshToken();

            // Save new Refresh Token
            await SaveRefreshTokenAsync(userRefreshToken.User, newRefreshToken);

            // Indicate which token replaced the old one
            userRefreshToken.ReplacedByTokenHash = HashToken(newRefreshToken);

            await _context.SaveChangesAsync();

            // Set new Refresh Token cookie
            SetRefreshTokenCookie(newRefreshToken);

            // Return new Access Token
            return Ok(new { accessToken = newAccessToken });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refreshToken"];
            if (!string.IsNullOrEmpty(refreshToken))
            {
                var hashedToken = HashToken(refreshToken);
                var userRefreshToken = await _context.UserRefreshTokens
                    .FirstOrDefaultAsync(rt => rt.TokenHash == hashedToken);

                if (userRefreshToken != null)
                {
                    userRefreshToken.RevokedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }

            // Delete the refresh token cookie
            Response.Cookies.Delete("refreshToken");
            return Ok(new { message = "Çıkış yapıldı." });
        }

        // --- Helper Methods ---

        private void SetRefreshTokenCookie(string token)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,   // Javascript can't read (XSS Protection)
                Expires = DateTime.UtcNow.AddDays(7),
                SameSite = SameSiteMode.Strict, // CSRF Protection
                Secure = true
            };
            Response.Cookies.Append("refreshToken", token, cookieOptions);
        }

        private async Task SaveRefreshTokenAsync(User user, string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);

            var userRefreshToken = new UserRefreshToken
            {
                Id = Guid.NewGuid(),
                TokenHash = tokenHash,
                UserId = user.Id,
                ExpiresAt = DateTime.UtcNow.AddDays(7),
                CreatedAt = DateTime.UtcNow,
                RevokedByIp = HttpContext.Connection.RemoteIpAddress?.ToString()
            };

            _context.UserRefreshTokens.Add(userRefreshToken);
            await _context.SaveChangesAsync();
        }

        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = Encoding.UTF8.GetBytes(token);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}