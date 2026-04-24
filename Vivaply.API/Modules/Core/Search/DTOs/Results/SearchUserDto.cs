using Vivaply.API.Modules.Core.Identity.Enums;

namespace Vivaply.API.Modules.Core.Search.DTOs.Results
{
    public class SearchUserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? Bio { get; set; }
        public bool IsCurrentUser { get; set; }
        public FollowStatus? RelationStatus { get; set; }
        public bool IsFollowingCurrentUser { get; set; }
        public int FollowersCount { get; set; }
        public int FollowingCount { get; set; }
    }
}
