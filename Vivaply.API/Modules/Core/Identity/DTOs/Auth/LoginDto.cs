using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.Modules.Core.Identity.DTOs.Auth
{
    public record LoginDto
    (
        [Required] string Identifier,
        [Required] string Password
    );
}
