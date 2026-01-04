using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.DTOs.Account
{
    // Updating user profile information
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

    // Changing user password
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string NewPassword { get; set; } = string.Empty;
    }

    // Avatar upload DTO (file handling)
    public class UploadAvatarDto
    {
        [Required]
        public IFormFile File { get; set; } = null!;
    }
}
