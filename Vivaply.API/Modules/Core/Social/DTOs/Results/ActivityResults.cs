using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Results
{
    public class ActivityDto
    {
        public Guid Id { get; set; }
        public ActivityActorDto Actor { get; set; } = new();
        public ActivityType Type { get; set; }
        public ActivityVisibility Visibility { get; set; }
        public DateTime OccurredAt { get; set; }
        public object Payload { get; set; } = null!;
    }

    public class ActivityActorDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string AvatarUrl { get; set; } = string.Empty;
    }

    public class ActivityFeedDto
    {
        public List<ActivityDto> Items { get; set; } = [];
        public string? NextCursor { get; set; }
    }

    public sealed record LibraryItemAddedPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl
    );

    public sealed record EpisodeWatchedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeNumber
    );

    public sealed record EpisodesWatchedBatchPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        List<int> EpisodeNumbers
    );

    public sealed record SeasonCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeCount
    );

    public sealed record ShowCompletedPayload(
        int TmdbShowId,
        string ShowName,
        string? PosterPath
    );

    public sealed record MovieWatchedPayload(
        int TmdbMovieId,
        string Title,
        string? PosterPath
    );

    public sealed record RatingPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        double Rating
    );

    public sealed record ReviewPayload(
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        string ReviewSnippet,
        double? Rating
    );
}
