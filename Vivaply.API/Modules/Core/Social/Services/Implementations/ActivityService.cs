using Microsoft.EntityFrameworkCore;
using System.Text;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.DTOs.Mappers;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Activities;
using Vivaply.API.Modules.Core.Social.Enums;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class ActivityService(VivaplyDbContext db, IPostService postService) : IActivityService
    {
        private readonly VivaplyDbContext _db = db;
        private readonly IPostService _postService = postService;

        public async Task CreateAsync(ActivityCreateRequest request, CancellationToken cancellationToken = default)
        {
            ArgumentNullException.ThrowIfNull(request);
            ArgumentNullException.ThrowIfNull(request.Payload);

            if (request.Type == ActivityType.EpisodeWatched && !string.IsNullOrWhiteSpace(request.AggregateKey))
            {
                var merged = await TryAggregateEpisodeWatchAsync(request, cancellationToken);
                if (merged)
                {
                    return;
                }
            }

            if (request.UpsertBySubject)
            {
                var updated = await TryUpsertBySubjectAsync(request, cancellationToken);
                if (updated)
                {
                    return;
                }
            }

            var entity = new UserActivity
            {
                UserId = request.UserId,
                Type = request.Type,
                SubjectType = request.SubjectType,
                SubjectId = request.SubjectId,
                ParentEntityType = request.ParentEntityType,
                ParentEntityId = request.ParentEntityId,
                SourceEntityType = request.SourceEntityType,
                SourceEntityId = request.SourceEntityId,
                PayloadJson = JsonHelper.Serialize(request.Payload) ?? "{}",
                AggregateKey = request.AggregateKey,
                AggregationWindowEndsAt = request.AggregationWindow.HasValue
                    ? request.OccurredAt.Add(request.AggregationWindow.Value)
                    : null,
                OccurredAt = request.OccurredAt
            };

            _db.UserActivities.Add(entity);
            await _db.SaveChangesAsync(cancellationToken);
            await _postService.SyncActivityPostAsync(entity, cancellationToken);
        }

        public async Task<ActivityFeedDto> GetFeedAsync(
            Guid currentUserId,
            ActivityQuery query,
            CancellationToken cancellationToken = default)
        {
            query ??= new ActivityQuery();
            var take = NormalizeTake(query.Take);
            var cursor = DecodeCursor(query.Cursor);

            var followingIds = await _db.UserFollows
                .Where(x => x.FollowerId == currentUserId && x.Status == FollowStatus.Accepted)
                .Select(x => x.FollowingId)
                .ToListAsync(cancellationToken);

            IQueryable<UserActivity> activities = _db.UserActivities
                .AsNoTracking()
                .Include(x => x.User)
                .Where(x =>
                    !x.IsDeleted &&
                    (x.UserId == currentUserId || followingIds.Contains(x.UserId)));

            activities = ApplyCursor(activities, cursor);

            var items = await activities
                .OrderByDescending(x => x.OccurredAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return BuildFeedResponse(items, take);
        }

        public async Task<ActivityFeedDto> GetProfileActivitiesAsync(
            Guid currentUserId,
            string username,
            ActivityQuery query,
            CancellationToken cancellationToken = default)
        {
            query ??= new ActivityQuery();
            var take = NormalizeTake(query.Take);
            var cursor = DecodeCursor(query.Cursor);

            var targetUser = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Username == username, cancellationToken)
                ?? throw new KeyNotFoundException("User not found.");

            bool isOwner = targetUser.Id == currentUserId;

            var preferences = await _db.UserPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == targetUser.Id, cancellationToken);

            var relationStatus = isOwner
                ? FollowStatus.Accepted
                : await _db.UserFollows
                    .Where(x => x.FollowerId == currentUserId && x.FollowingId == targetUser.Id)
                    .Select(x => (FollowStatus?)x.Status)
                    .FirstOrDefaultAsync(cancellationToken);

            if (!CanViewProfile(isOwner, preferences?.ProfileVisibility, relationStatus))
            {
                return new ActivityFeedDto();
            }

            IQueryable<UserActivity> activities = _db.UserActivities
                .AsNoTracking()
                .Include(x => x.User)
                .Where(x => x.UserId == targetUser.Id && !x.IsDeleted);

            activities = ApplyCursor(activities, cursor);

            var items = await activities
                .OrderByDescending(x => x.OccurredAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return BuildFeedResponse(items, take);
        }

        private async Task<bool> TryAggregateEpisodeWatchAsync(
            ActivityCreateRequest request,
            CancellationToken cancellationToken)
        {
            var existing = await _db.UserActivities
                .FirstOrDefaultAsync(x =>
                    x.UserId == request.UserId &&
                    x.AggregateKey == request.AggregateKey &&
                    x.AggregationWindowEndsAt != null &&
                    x.AggregationWindowEndsAt >= request.OccurredAt &&
                    !x.IsDeleted,
                    cancellationToken);

            if (existing == null || request.Payload is not EpisodeWatchedPayload newEpisode)
            {
                return false;
            }

            List<int> episodeNumbers;

            if (existing.Type == ActivityType.EpisodeWatched)
            {
                var existingPayload = JsonHelper.Deserialize<EpisodeWatchedPayload>(existing.PayloadJson);
                if (existingPayload == null || existingPayload.SeasonNumber != newEpisode.SeasonNumber)
                {
                    return false;
                }

                episodeNumbers = [existingPayload.EpisodeNumber, newEpisode.EpisodeNumber];
            }
            else if (existing.Type == ActivityType.EpisodesWatchedBatch)
            {
                var existingPayload = JsonHelper.Deserialize<EpisodesWatchedBatchPayload>(existing.PayloadJson);
                if (existingPayload == null || existingPayload.SeasonNumber != newEpisode.SeasonNumber)
                {
                    return false;
                }

                episodeNumbers = existingPayload.EpisodeNumbers;
                episodeNumbers.Add(newEpisode.EpisodeNumber);
            }
            else
            {
                return false;
            }

            existing.Type = ActivityType.EpisodesWatchedBatch;
            existing.PayloadJson = JsonHelper.Serialize(new EpisodesWatchedBatchPayload(
                newEpisode.TmdbShowId,
                newEpisode.ShowName,
                newEpisode.PosterPath,
                newEpisode.SeasonNumber,
                episodeNumbers.Distinct().OrderBy(x => x).ToList(),
                existing.Type == ActivityType.EpisodesWatchedBatch
                    ? JsonHelper.Deserialize<EpisodesWatchedBatchPayload>(existing.PayloadJson)?.Genres ?? newEpisode.Genres
                    : newEpisode.Genres
            )) ?? "{}";
            existing.SourceEntityType = request.SourceEntityType;
            existing.SourceEntityId = request.SourceEntityId;
            existing.OccurredAt = request.OccurredAt;
            existing.AggregationWindowEndsAt = request.AggregationWindow.HasValue
                ? request.OccurredAt.Add(request.AggregationWindow.Value)
                : existing.AggregationWindowEndsAt;

            await _db.SaveChangesAsync(cancellationToken);
            await _postService.SyncActivityPostAsync(existing, cancellationToken);
            return true;
        }

        private async Task<bool> TryUpsertBySubjectAsync(
            ActivityCreateRequest request,
            CancellationToken cancellationToken)
        {
            var existing = await _db.UserActivities
                .FirstOrDefaultAsync(x =>
                    x.UserId == request.UserId &&
                    x.Type == request.Type &&
                    x.SubjectType == request.SubjectType &&
                    x.SubjectId == request.SubjectId &&
                    !x.IsDeleted,
                    cancellationToken);

            if (existing == null)
            {
                return false;
            }

            existing.ParentEntityType = request.ParentEntityType;
            existing.ParentEntityId = request.ParentEntityId;
            existing.SourceEntityType = request.SourceEntityType;
            existing.SourceEntityId = request.SourceEntityId;
            existing.PayloadJson = JsonHelper.Serialize(request.Payload) ?? "{}";
            existing.OccurredAt = request.OccurredAt;
            existing.AggregateKey = request.AggregateKey;
            existing.AggregationWindowEndsAt = request.AggregationWindow.HasValue
                ? request.OccurredAt.Add(request.AggregationWindow.Value)
                : null;
            existing.IsDeleted = false;
            existing.DeletedAt = null;

            await _db.SaveChangesAsync(cancellationToken);
            await _postService.SyncActivityPostAsync(existing, cancellationToken);
            return true;
        }

        private static IQueryable<UserActivity> ApplyCursor(
            IQueryable<UserActivity> query,
            (DateTime occurredAt, Guid id)? cursor)
        {
            if (!cursor.HasValue)
            {
                return query;
            }

            var (occurredAt, id) = cursor.Value;

            return query.Where(x =>
                x.OccurredAt < occurredAt ||
                (x.OccurredAt == occurredAt && x.Id != id));
        }

        private ActivityFeedDto BuildFeedResponse(List<UserActivity> entities, int take)
        {
            string? nextCursor = null;

            if (entities.Count > take)
            {
                var next = entities[take - 1];
                nextCursor = EncodeCursor(next.OccurredAt, next.Id);
                entities = entities.Take(take).ToList();
            }

            return new ActivityFeedDto
            {
                Items = entities.Select(ActivityDtoMapper.Map).ToList(),
                NextCursor = nextCursor
            };
        }

        private static int NormalizeTake(int take) => Math.Clamp(take, 1, 50);

        private static bool CanViewProfile(
            bool isOwner,
            ProfileVisibility? profileVisibility,
            FollowStatus? relationStatus)
        {
            if (isOwner)
            {
                return true;
            }

            return profileVisibility switch
            {
                ProfileVisibility.Private => false,
                ProfileVisibility.FollowersOnly => relationStatus == FollowStatus.Accepted,
                _ => true
            };
        }

        private static string EncodeCursor(DateTime occurredAt, Guid id)
        {
            var raw = $"{occurredAt.ToBinary()}|{id:D}";
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
        }

        private static (DateTime occurredAt, Guid id)? DecodeCursor(string? cursor)
        {
            if (string.IsNullOrWhiteSpace(cursor))
            {
                return null;
            }

            try
            {
                var raw = Encoding.UTF8.GetString(Convert.FromBase64String(cursor));
                var parts = raw.Split('|', StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length != 2)
                {
                    return null;
                }

                if (!long.TryParse(parts[0], out var binary) || !Guid.TryParse(parts[1], out var id))
                {
                    return null;
                }

                return (DateTime.FromBinary(binary), id);
            }
            catch
            {
                return null;
            }
        }
    }
}
