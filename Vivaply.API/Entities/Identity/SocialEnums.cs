namespace Vivaply.API.Entities.Identity
{
    // Profile visibility
    public enum ProfileVisibility
    {
        Public = 0,          // Everyone can see the profile
        FollowersOnly = 1,   // Only followers can see the profile
        Private = 2          // Profile is hidden from everyone except the user
    }

    // Follow status
    public enum FollowStatus
    {
        Pending = 0,   // Follow request sent but not yet accepted
        Accepted = 1,  // Follow request accepted
        Rejected = 2   // Request rejected or follow removed (unfollow)
    }

    // Follow policy for accepting followers
    public enum FollowPolicy
    {
        AutoAccept = 0,   // Everybody can follow (public account)
        RequestOnly = 1,  // New followers require approval (private account)
        Disabled = 2      // Following is disabled (e.g., for business accounts or users who don't want followers)
    }

    // Activity visibility for posts, likes, etc.
    public enum ActivityVisibility
    {
        OnlyMe = 0,
        Followers = 1,
        Public = 2
    }
}
