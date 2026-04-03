using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.DTOs.Results;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IActivityService
    {
        Task CreateAsync(ActivityCreateRequest request, CancellationToken cancellationToken = default);
        Task<ActivityFeedDto> GetFeedAsync(Guid currentUserId, ActivityQuery query, CancellationToken cancellationToken = default);
        Task<ActivityFeedDto> GetProfileActivitiesAsync(Guid currentUserId, string username, ActivityQuery query, CancellationToken cancellationToken = default);
    }

    public class ActivityCreateRequest
    {
        public Guid UserId { get; set; }
        public ActivityType Type { get; set; }
        public string SubjectType { get; set; } = string.Empty;
        public string SubjectId { get; set; } = string.Empty;
        public string? ParentEntityType { get; set; }
        public string? ParentEntityId { get; set; }
        public string? SourceEntityType { get; set; }
        public string? SourceEntityId { get; set; }
        public object Payload { get; set; } = null!;
        public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
        public bool IncludeInFeed { get; set; } = true;
        public string? AggregateKey { get; set; }
        public TimeSpan? AggregationWindow { get; set; }
        public bool UpsertBySubject { get; set; }
    }
}
