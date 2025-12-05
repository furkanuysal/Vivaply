namespace Vivaply.API.Entities.Knowledge
{
    public enum ReadStatus
    {
        None = 0,
        PlanToRead = 1, // Planning to read
        Reading = 2,    // Reading
        Completed = 3,  // Done reading / Completed
        OnHold = 4,     // Reading on hold
        Dropped = 5     // Dropped / Abandoned
    }
}
