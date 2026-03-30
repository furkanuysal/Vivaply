using Vivaply.API.Entities.Identity;

namespace Vivaply.API.Services.Social.Follow
{
    public interface IFollowService
    {
        // Follow operation (may be auto-accepted or pending)
        Task FollowAsync(Guid currentUserId, Guid targetUserId);

        // Unfollow (regardless of whether accepted or pending, it is removed)
        Task UnfollowAsync(Guid currentUserId, Guid targetUserId);

        // Accept the follow request
        Task AcceptRequestAsync(Guid currentUserId, Guid requesterId);

        // Reject a follow request
        Task RejectRequestAsync(Guid currentUserId, Guid requesterId);

        // Followers list
        Task<List<Guid>> GetFollowersAsync(Guid userId);

        // Following list
        Task<List<Guid>> GetFollowingAsync(Guid userId);

        // Pending requests (for private accounts)
        Task<List<Guid>> GetPendingRequestsAsync(Guid userId);

        // Check for a one-to-one relationship
        Task<FollowStatus?> GetRelationStatusAsync(Guid currentUserId, Guid targetUserId);
    }
}
