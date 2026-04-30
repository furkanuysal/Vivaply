using System.ComponentModel.DataAnnotations;
using Vivaply.API.Modules.Core.Identity.Enums;

namespace Vivaply.API.Modules.Core.Identity.DTOs.Account
{
    public class UpdateProfileDto
    {
        [Required]
        [MaxLength(50)]
        public string Username { get; set; } = string.Empty;

        [MaxLength(200)]
        public string? Bio { get; set; }

        [MaxLength(50)]
        public string? Location { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdatePreferencesDto
    {
        [Required]
        public ProfileVisibility ProfileVisibility { get; set; }

        [Required]
        public ActivityVisibility ActivityVisibility { get; set; }

        [Required]
        public FollowPolicy FollowPolicy { get; set; }

        public bool EmailNotifications { get; set; }
        public bool PushNotifications { get; set; }
    }

    public class UploadAvatarDto
    {
        [Required]
        public IFormFile File { get; set; } = null!;
    }
}
