using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.DTOs
{
    public record LoginDto
    (
        [Required] string Identifier,
        [Required] string Password
    );
}
