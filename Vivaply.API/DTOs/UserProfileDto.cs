namespace Vivaply.API.DTOs
{
    public record UserProfileDto
    (
        string Username,
        string Email,
        int Level,
        long CurrentXp,
        long TotalXp,
        decimal Money,
        int CurrentStreak
    );
}