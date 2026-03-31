namespace Vivaply.API.Modules.Core.Identity.Enums
{
    // Follow policy for accepting followers
    public enum FollowPolicy
    {
        AutoAccept = 0,   // Everybody can follow (public account)
        RequestOnly = 1,  // New followers require approval (private account)
        Disabled = 2      // Following is disabled (e.g., for business accounts or users who don't want followers)
    }
}
