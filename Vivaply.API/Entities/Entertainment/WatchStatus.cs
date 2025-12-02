namespace Vivaply.API.Entities.Entertainment
{
    public enum WatchStatus
    {
        None = 0,
        PlanToWatch = 1, // Watchlist
        Watching = 2,    // Watching
        Completed = 3,   // Completed
        OnHold = 4,      // On hold
        Dropped = 5      // Dropped
    }
}