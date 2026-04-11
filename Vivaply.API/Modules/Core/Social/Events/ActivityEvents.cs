using Vivaply.API.Infrastructure.Core;

namespace Vivaply.API.Modules.Core.Social.Events
{
    public sealed record LibraryItemAddedEvent(
        Guid UserId,
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        string? SourceEntityType,
        string? SourceEntityId,
        List<string>? Developers = null,
        List<string>? Genres = null,
        List<string>? Authors = null
    ) : IApplicationEvent;

    public sealed record EpisodeWatchedEvent(
        Guid UserId,
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeNumber,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record SeasonCompletedEvent(
        Guid UserId,
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        int SeasonNumber,
        int EpisodeCount,
        DateTime OccurredAt,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record ShowCompletedEvent(
        Guid UserId,
        int TmdbShowId,
        string ShowName,
        string? PosterPath,
        DateTime OccurredAt,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record MovieWatchedEvent(
        Guid UserId,
        int TmdbMovieId,
        string Title,
        string? PosterPath,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record MediaRatedEvent(
        Guid UserId,
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        double Rating,
        string? SourceEntityType,
        string? SourceEntityId,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record MediaReviewAddedEvent(
        Guid UserId,
        string SubjectType,
        string SubjectId,
        string Title,
        string? ImageUrl,
        string Review,
        double? Rating,
        string? SourceEntityType,
        string? SourceEntityId,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record GameStartedEvent(
        Guid UserId,
        int IgdbId,
        string Title,
        string? CoverUrl,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Developers = null,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record GameCompletedEvent(
        Guid UserId,
        int IgdbId,
        string Title,
        string? CoverUrl,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Developers = null,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record GameRatedEvent(
        Guid UserId,
        int IgdbId,
        string Title,
        string? CoverUrl,
        double Rating,
        string? SourceEntityId,
        List<string>? Developers = null,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record GameReviewAddedEvent(
        Guid UserId,
        int IgdbId,
        string Title,
        string? CoverUrl,
        string Review,
        double? Rating,
        string? SourceEntityId,
        List<string>? Developers = null,
        List<string>? Genres = null
    ) : IApplicationEvent;

    public sealed record BookStartedEvent(
        Guid UserId,
        string GoogleBookId,
        string Title,
        string? CoverUrl,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Authors = null
    ) : IApplicationEvent;

    public sealed record BookFinishedEvent(
        Guid UserId,
        string GoogleBookId,
        string Title,
        string? CoverUrl,
        DateTime OccurredAt,
        string? SourceEntityId,
        List<string>? Authors = null
    ) : IApplicationEvent;

    public sealed record BookRatedEvent(
        Guid UserId,
        string GoogleBookId,
        string Title,
        string? CoverUrl,
        double Rating,
        string? SourceEntityId,
        List<string>? Authors = null
    ) : IApplicationEvent;

    public sealed record BookReviewAddedEvent(
        Guid UserId,
        string GoogleBookId,
        string Title,
        string? CoverUrl,
        string Review,
        double? Rating,
        string? SourceEntityId,
        List<string>? Authors = null
    ) : IApplicationEvent;
}
