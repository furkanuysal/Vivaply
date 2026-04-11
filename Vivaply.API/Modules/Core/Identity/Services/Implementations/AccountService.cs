using Vivaply.API.Data;
using Vivaply.API.Entities.Gamification;
using Microsoft.EntityFrameworkCore;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Identity.Services.Interfaces;
using Vivaply.API.Modules.Core.Identity.DTOs.Account;

namespace Vivaply.API.Modules.Core.Identity.Services.Implementations
{
    public class AccountService(VivaplyDbContext dbContext, IImageService imageService) : IAccountService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private readonly IImageService _imageService = imageService;

        public async Task<UserProfileDto> GetProfileAsync(Guid userId)
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile) // Gamification profile
                .Include(u => u.Wallet)  // Wallet
                .Include(u => u.Preferences)
                .AsNoTracking()          // For fast reading
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            var followersCount = await _dbContext.UserFollows
                .CountAsync(x => x.FollowingId == user.Id && x.Status == FollowStatus.Accepted);

            var followingCount = await _dbContext.UserFollows
                .CountAsync(x => x.FollowerId == user.Id && x.Status == FollowStatus.Accepted);

            var isFollowingCurrentUser = false;

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
                Money = user.Wallet?.Balance ?? 0,
                IsCurrentUser = true,
                RelationStatus = FollowStatus.Accepted,
                FollowPolicy = user.Preferences?.FollowPolicy ?? FollowPolicy.AutoAccept,
                IsFollowingCurrentUser = isFollowingCurrentUser,
                FollowersCount = followersCount,
                FollowingCount = followingCount
            };
        }

        public async Task<UserProfileDto> GetProfileByUsernameAsync(Guid currentUserId, string username)
        {
            var user = await _dbContext.Users
                .Include(u => u.Profile)
                .Include(u => u.Wallet)
                .Include(u => u.Preferences)
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
                throw new KeyNotFoundException("User not found.");

            var followersCount = await _dbContext.UserFollows
                .CountAsync(x => x.FollowingId == user.Id && x.Status == FollowStatus.Accepted);

            var followingCount = await _dbContext.UserFollows
                .CountAsync(x => x.FollowerId == user.Id && x.Status == FollowStatus.Accepted);

            var isOwner = user.Id == currentUserId;

            if (!isOwner)
            {
                var preferences = await _dbContext.UserPreferences
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.UserId == user.Id);

                var relationStatus = await _dbContext.UserFollows
                    .Where(x => x.FollowerId == currentUserId && x.FollowingId == user.Id)
                    .Select(x => (FollowStatus?)x.Status)
                    .FirstOrDefaultAsync();

                if (!CanViewProfile(preferences?.ProfileVisibility, relationStatus))
                    throw new UnauthorizedAccessException("You are not allowed to view this profile.");
            }

            var relationStatusForDto = isOwner
                ? FollowStatus.Accepted
                : await _dbContext.UserFollows
                    .Where(x => x.FollowerId == currentUserId && x.FollowingId == user.Id)
                    .Select(x => (FollowStatus?)x.Status)
                    .FirstOrDefaultAsync();

            var isFollowingCurrentUser = !isOwner && await _dbContext.UserFollows
                .AnyAsync(x =>
                    x.FollowerId == user.Id &&
                    x.FollowingId == currentUserId &&
                    x.Status == FollowStatus.Accepted);

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
                Money = user.Wallet?.Balance ?? 0,
                IsCurrentUser = isOwner,
                RelationStatus = relationStatusForDto,
                FollowPolicy = user.Preferences?.FollowPolicy ?? FollowPolicy.AutoAccept,
                IsFollowingCurrentUser = isFollowingCurrentUser,
                FollowersCount = followersCount,
                FollowingCount = followingCount
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

        private static bool CanViewProfile(ProfileVisibility? profileVisibility, FollowStatus? relationStatus)
        {
            return profileVisibility switch
            {
                ProfileVisibility.Private => false,
                ProfileVisibility.FollowersOnly => relationStatus == FollowStatus.Accepted,
                _ => true
            };
        }
    }
}
