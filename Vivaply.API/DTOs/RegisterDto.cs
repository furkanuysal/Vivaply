using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.DTOs
{
    public record RegisterDto
    (
        [Required] string Username,
        [Required][EmailAddress] string Email,
        [Required][MinLength(6)] string Password
    );
}
