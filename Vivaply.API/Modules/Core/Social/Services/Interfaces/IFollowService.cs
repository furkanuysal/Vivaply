using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Follows;

namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IFollowService
    {
        Task FollowAsync(Guid currentUserId, Guid targetUserId);
        Task UnfollowAsync(Guid currentUserId, Guid targetUserId);
        Task AcceptRequestAsync(Guid currentUserId, Guid requesterId);
        Task RejectRequestAsync(Guid currentUserId, Guid requesterId);
        Task<List<FollowUserDto>> GetFollowersAsync(Guid currentUserId, Guid userId);
        Task<List<FollowUserDto>> GetFollowingAsync(Guid currentUserId, Guid userId);
        Task<List<Guid>> GetPendingRequestsAsync(Guid userId);
        Task<FollowStatus?> GetRelationStatusAsync(Guid currentUserId, Guid targetUserId);
    }
}
