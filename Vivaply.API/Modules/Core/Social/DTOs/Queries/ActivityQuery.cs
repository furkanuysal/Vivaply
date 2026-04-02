namespace Vivaply.API.Modules.Core.Social.DTOs.Queries
{
    public class ActivityQuery
    {
        public string? Cursor { get; set; }
        public int Take { get; set; } = 20;
    }
}
