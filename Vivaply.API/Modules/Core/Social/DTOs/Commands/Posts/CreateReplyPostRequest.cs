using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts
{
    public class CreateReplyPostRequest
    {
        [Required]
        [StringLength(4000, MinimumLength = 1)]
        public string TextContent { get; set; } = string.Empty;
    }
}
