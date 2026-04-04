using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Results.Activities
{
    public class ActivityDto
    {
        public Guid Id { get; set; }
        public ActivityActorDto Actor { get; set; } = new();
        public ActivityType Type { get; set; }
        public DateTime OccurredAt { get; set; }
        public object Payload { get; set; } = null!;
    }
}
