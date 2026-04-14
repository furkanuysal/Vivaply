using System.ComponentModel.DataAnnotations;

namespace Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts
{
    public class CreateReplyPostRequest
    {
        [StringLength(4000)]
        public string? TextContent { get; set; }
        public List<IFormFile>? Files { get; set; }
        public List<IFormFile>? ThumbnailFiles { get; set; }
        public List<int>? ThumbnailIndexes { get; set; }
    }
}
