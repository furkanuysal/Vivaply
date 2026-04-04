using Vivaply.API.Entities.Identity;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Activities;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Social.DTOs.Mappers
{
    internal static class ActivityDtoMapper
    {
        public static ActivityDto Map(UserActivity entity)
        {
            return new ActivityDto
            {
                Id = entity.Id,
                Actor = new ActivityActorDto
                {
                    Id = entity.UserId,
                    Username = entity.User?.Username ?? string.Empty,
                    AvatarUrl = entity.User?.AvatarUrl ?? string.Empty
                },
                Type = entity.Type,
                OccurredAt = entity.OccurredAt,
                Payload = DeserializePayload(entity)
            };
        }

        public static object DeserializePayload(UserActivity entity)
        {
            return entity.Type switch
            {
                ActivityType.LibraryItemAdded => JsonHelper.Deserialize<LibraryItemAddedPayload>(entity.PayloadJson) ?? new LibraryItemAddedPayload(entity.SubjectType, entity.SubjectId, string.Empty, null),
                ActivityType.EpisodeWatched => JsonHelper.Deserialize<EpisodeWatchedPayload>(entity.PayloadJson) ?? new EpisodeWatchedPayload(0, string.Empty, null, 0, 0),
                ActivityType.EpisodesWatchedBatch => JsonHelper.Deserialize<EpisodesWatchedBatchPayload>(entity.PayloadJson) ?? new EpisodesWatchedBatchPayload(0, string.Empty, null, 0, []),
                ActivityType.SeasonCompleted => JsonHelper.Deserialize<SeasonCompletedPayload>(entity.PayloadJson) ?? new SeasonCompletedPayload(0, string.Empty, null, 0, 0),
                ActivityType.ShowCompleted => JsonHelper.Deserialize<ShowCompletedPayload>(entity.PayloadJson) ?? new ShowCompletedPayload(0, string.Empty, null),
                ActivityType.MovieWatched => JsonHelper.Deserialize<MovieWatchedPayload>(entity.PayloadJson) ?? new MovieWatchedPayload(0, string.Empty, null),
                ActivityType.MediaRated or ActivityType.GameRated or ActivityType.BookRated =>
                    JsonHelper.Deserialize<RatingPayload>(entity.PayloadJson) ?? new RatingPayload(entity.SubjectType, entity.SubjectId, string.Empty, null, 0),
                ActivityType.MediaReviewAdded or ActivityType.GameReviewAdded or ActivityType.BookReviewAdded =>
                    JsonHelper.Deserialize<ReviewPayload>(entity.PayloadJson) ?? new ReviewPayload(entity.SubjectType, entity.SubjectId, string.Empty, null, string.Empty, null),
                ActivityType.GameStarted or ActivityType.GameCompleted or ActivityType.BookStarted or ActivityType.BookFinished =>
                    JsonHelper.Deserialize<LibraryItemAddedPayload>(entity.PayloadJson) ?? new LibraryItemAddedPayload(entity.SubjectType, entity.SubjectId, string.Empty, null),
                _ => new { }
            };
        }
    }
}
