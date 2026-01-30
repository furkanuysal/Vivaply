using Vivaply.API.Data;
using Vivaply.API.DTOs.Account;
using Vivaply.API.Entities.Gamification;
using Vivaply.API.Services.Account.Images;
using Microsoft.EntityFrameworkCore;

namespace Vivaply.API.Services.Account
{
    public class AccountService : IAccountService
    {
        private readonly VivaplyDbContext _dbContext;
        private readonly IImageService _imageService;

        public AccountService(VivaplyDbContext dbContext, IImageService imageService)
        {
            _dbContext = dbContext;
            _imageService = imageService;
        }

        public async Task<UserProfileDto> GetProfileAsync(Guid userId)
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile) // Gamification profile
                .Include(u => u.Wallet)  // Wallet
                .AsNoTracking()          // For fast reading
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            return new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                AvatarUrl = user.AvatarUrl,
                Bio = user.Profile?.Bio,
                Location = user.Profile?.Location,
                Level = user.Profile?.Level ?? 1,
                CurrentXp = user.Profile?.CurrentXp ?? 0,
                TotalXp = user.Profile?.TotalXp ?? 0,
                CurrentStreak = user.Profile?.CurrentStreak ?? 0,
                Money = user.Wallet?.Balance ?? 0
            };
        }

        // Update Profile
        public async Task UpdateProfileAsync(Guid userId, UpdateProfileDto request)
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            // If username is changed, check for duplicates
            if (!string.Equals(user.Username, request.Username, StringComparison.OrdinalIgnoreCase))
            {
                var exists = await _dbContext.Users.AnyAsync(u => u.Username == request.Username);
                if (exists)
                    throw new InvalidOperationException("Username already exists.");

                user.Username = request.Username;
            }

            // If profile doesn't exist, create it (Defensive)
            if (user.Profile == null)
            {
                user.Profile = new UserProfile { UserId = userId };
                _dbContext.UserProfiles.Add(user.Profile);
            }

            // Update profile data
            user.Profile.Bio = request.Bio;
            user.Profile.Location = request.Location;

            await _dbContext.SaveChangesAsync();
        }

        // Upload Avatar
        public async Task<string> UploadAvatarAsync(Guid userId, UploadAvatarDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new KeyNotFoundException("User not found.");

            // ImageService handles everything (validation + save + delete)
            var avatarUrl = await _imageService.SaveOrReplaceImageAsync(
                request.File,
                user.AvatarUrl
            );

            user.AvatarUrl = avatarUrl;
            await _dbContext.SaveChangesAsync();

            return avatarUrl;
        }

        public async Task ChangePasswordAsync(Guid userId, ChangePasswordDto request)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new KeyNotFoundException("User not found.");

            // Old password verification
            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            {
                throw new ArgumentException("Current password is incorrect.");
            }

            // Hash new password
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteAccountAsync(Guid userId)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new KeyNotFoundException("User not found.");

            // Delete avatar from disk
            if (!string.IsNullOrEmpty(user.AvatarUrl))
            {
                _imageService.DeleteImage(user.AvatarUrl);
            }

            // Delete user (Cascade deletes related data)
            _dbContext.Users.Remove(user);
            await _dbContext.SaveChangesAsync();
        }
    }
}
