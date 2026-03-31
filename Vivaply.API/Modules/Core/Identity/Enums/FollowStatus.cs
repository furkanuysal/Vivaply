namespace Vivaply.API.Modules.Core.Identity.Enums
{
    // Follow status
    public enum FollowStatus
    {
        Pending = 0,   // Follow request sent but not yet accepted
        Accepted = 1,  // Follow request accepted
        Rejected = 2   // Request rejected or follow removed (unfollow)
    }
}
