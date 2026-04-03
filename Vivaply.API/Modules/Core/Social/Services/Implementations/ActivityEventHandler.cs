using Vivaply.API.Infrastructure.Core;
using Vivaply.API.Modules.Core.Social.DTOs.Results;
using Vivaply.API.Modules.Core.Social.Enums;
using Vivaply.API.Modules.Core.Social.Events;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class ActivityEventHandler(IActivityService activityService) :
        IApplicationEventHandler<LibraryItemAddedEvent>,
        IApplicationEventHandler<EpisodeWatchedEvent>,
        IApplicationEventHandler<SeasonCompletedEvent>,
        IApplicationEventHandler<ShowCompletedEvent>,
        IApplicationEventHandler<MovieWatchedEvent>,
        IApplicationEventHandler<MediaRatedEvent>,
        IApplicationEventHandler<MediaReviewAddedEvent>,
        IApplicationEventHandler<GameStartedEvent>,
        IApplicationEventHandler<GameCompletedEvent>,
        IApplicationEventHandler<GameRatedEvent>,
        IApplicationEventHandler<GameReviewAddedEvent>,
        IApplicationEventHandler<BookStartedEvent>,
        IApplicationEventHandler<BookFinishedEvent>,
        IApplicationEventHandler<BookRatedEvent>,
        IApplicationEventHandler<BookReviewAddedEvent>
    {
        private readonly IActivityService _activityService = activityService;

        public Task HandleAsync(LibraryItemAddedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.LibraryItemAdded,
                SubjectType = appEvent.SubjectType,
                SubjectId = appEvent.SubjectId,
                SourceEntityType = appEvent.SourceEntityType,
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new LibraryItemAddedPayload(
                    appEvent.SubjectType,
                    appEvent.SubjectId,
                    appEvent.Title,
                    appEvent.ImageUrl
                ),
                IncludeInFeed = false
            }, cancellationToken);

        public Task HandleAsync(EpisodeWatchedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.EpisodeWatched,
                SubjectType = "tv_episode",
                SubjectId = $"tmdb:{appEvent.TmdbShowId}:s{appEvent.SeasonNumber}:e{appEvent.EpisodeNumber}",
                ParentEntityType = "tv_show",
                ParentEntityId = appEvent.TmdbShowId.ToString(),
                SourceEntityType = "WatchedEpisode",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new EpisodeWatchedPayload(
                    appEvent.TmdbShowId,
                    appEvent.ShowName,
                    appEvent.PosterPath,
                    appEvent.SeasonNumber,
                    appEvent.EpisodeNumber
                ),
                OccurredAt = appEvent.OccurredAt,
                AggregateKey = $"episode-watch:{appEvent.UserId}:show:{appEvent.TmdbShowId}",
                AggregationWindow = TimeSpan.FromMinutes(30)
            }, cancellationToken);

        public Task HandleAsync(SeasonCompletedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.SeasonCompleted,
                SubjectType = "tv_season",
                SubjectId = $"tmdb:{appEvent.TmdbShowId}:s{appEvent.SeasonNumber}",
                ParentEntityType = "tv_show",
                ParentEntityId = appEvent.TmdbShowId.ToString(),
                Payload = new SeasonCompletedPayload(
                    appEvent.TmdbShowId,
                    appEvent.ShowName,
                    appEvent.PosterPath,
                    appEvent.SeasonNumber,
                    appEvent.EpisodeCount
                ),
                OccurredAt = appEvent.OccurredAt
            }, cancellationToken);

        public Task HandleAsync(ShowCompletedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.ShowCompleted,
                SubjectType = "tv_show",
                SubjectId = appEvent.TmdbShowId.ToString(),
                Payload = new ShowCompletedPayload(
                    appEvent.TmdbShowId,
                    appEvent.ShowName,
                    appEvent.PosterPath
                ),
                OccurredAt = appEvent.OccurredAt
            }, cancellationToken);

        public Task HandleAsync(MovieWatchedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.MovieWatched,
                SubjectType = "movie",
                SubjectId = appEvent.TmdbMovieId.ToString(),
                SourceEntityType = "UserMovie",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new MovieWatchedPayload(
                    appEvent.TmdbMovieId,
                    appEvent.Title,
                    appEvent.PosterPath
                ),
                OccurredAt = appEvent.OccurredAt
            }, cancellationToken);

        public Task HandleAsync(MediaRatedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.MediaRated,
                SubjectType = appEvent.SubjectType,
                SubjectId = appEvent.SubjectId,
                SourceEntityType = appEvent.SourceEntityType,
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new RatingPayload(
                    appEvent.SubjectType,
                    appEvent.SubjectId,
                    appEvent.Title,
                    appEvent.ImageUrl,
                    appEvent.Rating
                ),
                UpsertBySubject = true
            }, cancellationToken);

        public Task HandleAsync(MediaReviewAddedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.MediaReviewAdded,
                SubjectType = appEvent.SubjectType,
                SubjectId = appEvent.SubjectId,
                SourceEntityType = appEvent.SourceEntityType,
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new ReviewPayload(
                    appEvent.SubjectType,
                    appEvent.SubjectId,
                    appEvent.Title,
                    appEvent.ImageUrl,
                    BuildReviewSnippet(appEvent.Review),
                    appEvent.Rating
                ),
                UpsertBySubject = true
            }, cancellationToken);

        public Task HandleAsync(GameStartedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.GameStarted,
                SubjectType = "game",
                SubjectId = appEvent.IgdbId.ToString(),
                SourceEntityType = "UserGame",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new LibraryItemAddedPayload("game", appEvent.IgdbId.ToString(), appEvent.Title, appEvent.CoverUrl),
                OccurredAt = appEvent.OccurredAt,
                IncludeInFeed = false
            }, cancellationToken);

        public Task HandleAsync(GameCompletedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.GameCompleted,
                SubjectType = "game",
                SubjectId = appEvent.IgdbId.ToString(),
                SourceEntityType = "UserGame",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new LibraryItemAddedPayload("game", appEvent.IgdbId.ToString(), appEvent.Title, appEvent.CoverUrl),
                OccurredAt = appEvent.OccurredAt
            }, cancellationToken);

        public Task HandleAsync(GameRatedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.GameRated,
                SubjectType = "game",
                SubjectId = appEvent.IgdbId.ToString(),
                SourceEntityType = "UserGame",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new RatingPayload("game", appEvent.IgdbId.ToString(), appEvent.Title, appEvent.CoverUrl, appEvent.Rating),
                UpsertBySubject = true
            }, cancellationToken);

        public Task HandleAsync(GameReviewAddedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.GameReviewAdded,
                SubjectType = "game",
                SubjectId = appEvent.IgdbId.ToString(),
                SourceEntityType = "UserGame",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new ReviewPayload("game", appEvent.IgdbId.ToString(), appEvent.Title, appEvent.CoverUrl, BuildReviewSnippet(appEvent.Review), appEvent.Rating),
                UpsertBySubject = true
            }, cancellationToken);

        public Task HandleAsync(BookStartedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.BookStarted,
                SubjectType = "book",
                SubjectId = appEvent.GoogleBookId,
                SourceEntityType = "UserBook",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new LibraryItemAddedPayload("book", appEvent.GoogleBookId, appEvent.Title, appEvent.CoverUrl),
                OccurredAt = appEvent.OccurredAt,
                IncludeInFeed = false
            }, cancellationToken);

        public Task HandleAsync(BookFinishedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.BookFinished,
                SubjectType = "book",
                SubjectId = appEvent.GoogleBookId,
                SourceEntityType = "UserBook",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new LibraryItemAddedPayload("book", appEvent.GoogleBookId, appEvent.Title, appEvent.CoverUrl),
                OccurredAt = appEvent.OccurredAt
            }, cancellationToken);

        public Task HandleAsync(BookRatedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.BookRated,
                SubjectType = "book",
                SubjectId = appEvent.GoogleBookId,
                SourceEntityType = "UserBook",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new RatingPayload("book", appEvent.GoogleBookId, appEvent.Title, appEvent.CoverUrl, appEvent.Rating),
                UpsertBySubject = true
            }, cancellationToken);

        public Task HandleAsync(BookReviewAddedEvent appEvent, CancellationToken cancellationToken = default)
            => _activityService.CreateAsync(new ActivityCreateRequest
            {
                UserId = appEvent.UserId,
                Type = ActivityType.BookReviewAdded,
                SubjectType = "book",
                SubjectId = appEvent.GoogleBookId,
                SourceEntityType = "UserBook",
                SourceEntityId = appEvent.SourceEntityId,
                Payload = new ReviewPayload("book", appEvent.GoogleBookId, appEvent.Title, appEvent.CoverUrl, BuildReviewSnippet(appEvent.Review), appEvent.Rating),
                UpsertBySubject = true
            }, cancellationToken);

        private static string BuildReviewSnippet(string review)
        {
            const int maxLength = 180;
            if (string.IsNullOrWhiteSpace(review))
            {
                return string.Empty;
            }

            var normalized = review.Trim();

            return normalized.Length <= maxLength
                ? normalized
                : normalized[..maxLength].TrimEnd() + "...";
        }
    }
}
