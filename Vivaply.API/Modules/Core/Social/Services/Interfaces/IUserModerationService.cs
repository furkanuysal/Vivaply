namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IUserModerationService
    {
        Task BlockAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default);
        Task UnblockAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default);
        Task MuteAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default);
        Task UnmuteAsync(Guid currentUserId, Guid targetUserId, CancellationToken cancellationToken = default);
        Task<List<DTOs.Results.Follows.FollowUserDto>> GetBlockedUsersAsync(Guid currentUserId, CancellationToken cancellationToken = default);
        Task<List<DTOs.Results.Follows.FollowUserDto>> GetMutedUsersAsync(Guid currentUserId, CancellationToken cancellationToken = default);
        Task<bool> IsBlockedEitherWayAsync(Guid currentUserId, Guid otherUserId, CancellationToken cancellationToken = default);
        Task<HashSet<Guid>> GetBlockedOrBlockingUserIdsAsync(Guid currentUserId, CancellationToken cancellationToken = default);
        Task<HashSet<Guid>> GetMutedUserIdsAsync(Guid currentUserId, CancellationToken cancellationToken = default);
    }
}
