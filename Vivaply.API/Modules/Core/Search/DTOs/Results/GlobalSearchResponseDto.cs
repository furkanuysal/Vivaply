using Vivaply.API.Modules.Core.Social.DTOs.Results.Posts;

namespace Vivaply.API.Modules.Core.Search.DTOs.Results
{
    public class GlobalSearchResponseDto
    {
        public List<SearchUserDto> Users { get; set; } = [];
        public List<PostDto> Posts { get; set; } = [];
    }
}
