namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Activities
{
    public class ActivityFeedDto
    {
        public List<ActivityDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }
}
