using Microsoft.EntityFrameworkCore;
using System.Text;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts;
using Vivaply.API.Modules.Core.Social.DTOs.Mappers;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Posts;
using Vivaply.API.Modules.Core.Social.Enums;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class PostService(VivaplyDbContext db) : IPostService
    {
        private readonly VivaplyDbContext _db = db;

        public async Task SyncActivityPostAsync(UserActivity activity, CancellationToken cancellationToken = default)
        {
            var existing = await _db.UserPosts
                .FirstOrDefaultAsync(x => x.ActivityId == activity.Id, cancellationToken);

            if (activity.IsDeleted || !ShouldCreatePost(activity.Type))
            {
                if (existing != null && !existing.IsDeleted)
                {
                    existing.IsDeleted = true;
                    existing.DeletedAt = activity.DeletedAt ?? DateTime.UtcNow;
                    existing.UpdatedAt = activity.OccurredAt;
                    await _db.SaveChangesAsync(cancellationToken);
                }

                return;
            }

            if (existing == null)
            {
                existing = new UserPost
                {
                    UserId = activity.UserId,
                    Type = PostType.Activity,
                    ActivityId = activity.Id,
                    PublishedAt = activity.OccurredAt
                };

                _db.UserPosts.Add(existing);
            }
            else
            {
                existing.UserId = activity.UserId;
                existing.Type = PostType.Activity;
                existing.PublishedAt = activity.OccurredAt;
                existing.UpdatedAt = activity.OccurredAt;
                existing.IsDeleted = false;
                existing.DeletedAt = null;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<PostFeedDto> GetFeedAsync(Guid currentUserId, PostQuery query, CancellationToken cancellationToken = default)
        {
            query ??= new PostQuery();
            var take = NormalizeTake(query.Take);
            var cursor = DecodeCursor(query.Cursor);

            var followingIds = await _db.UserFollows
                .Where(x => x.FollowerId == currentUserId && x.Status == FollowStatus.Accepted)
                .Select(x => x.FollowingId)
                .ToListAsync(cancellationToken);

            IQueryable<UserPost> posts = _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Where(x =>
                    !x.IsDeleted &&
                    x.ParentPostId == null &&
                    (x.UserId == currentUserId || followingIds.Contains(x.UserId)));

            posts = ApplyCursor(posts, cursor);

            var items = await posts
                .OrderByDescending(x => x.PublishedAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return await BuildFeedResponseAsync(items, take, cancellationToken);
        }

        public async Task<PostFeedDto> GetProfilePostsAsync(Guid currentUserId, string username, PostQuery query, CancellationToken cancellationToken = default)
        {
            query ??= new PostQuery();
            var take = NormalizeTake(query.Take);
            var cursor = DecodeCursor(query.Cursor);

            var targetUser = await _db.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Username == username, cancellationToken)
                ?? throw new KeyNotFoundException("User not found.");

            var isOwner = targetUser.Id == currentUserId;

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
                return new PostFeedDto();
            }

            IQueryable<UserPost> posts = _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Where(x =>
                    x.UserId == targetUser.Id &&
                    !x.IsDeleted &&
                    x.ParentPostId == null);

            posts = ApplyCursor(posts, cursor);

            var items = await posts
                .OrderByDescending(x => x.PublishedAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return await BuildFeedResponseAsync(items, take, cancellationToken);
        }

        public async Task<PostDto?> GetByIdAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            var post = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x => x.Id == postId && !x.IsDeleted, cancellationToken);

            if (post == null)
            {
                return null;
            }

            var isOwner = post.UserId == currentUserId;
            var preferences = await _db.UserPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == post.UserId, cancellationToken);

            var relationStatus = isOwner
                ? FollowStatus.Accepted
                : await _db.UserFollows
                    .Where(x => x.FollowerId == currentUserId && x.FollowingId == post.UserId)
                    .Select(x => (FollowStatus?)x.Status)
                    .FirstOrDefaultAsync(cancellationToken);

            if (!CanViewProfile(isOwner, preferences?.ProfileVisibility, relationStatus))
            {
                return null;
            }

            var dto = MapToDto(post);
            dto.Replies = await BuildReplyThreadAsync(post.Id, cancellationToken);
            dto.Stats.ReplyCount = dto.Replies.Count;

            return dto;
        }

        public async Task<PostReplyDto?> CreateReplyAsync(
            Guid currentUserId,
            Guid parentPostId,
            CreateReplyPostRequest request,
            CancellationToken cancellationToken = default)
        {
            var parentPost = await _db.UserPosts
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == parentPostId && !x.IsDeleted, cancellationToken);

            if (parentPost == null)
            {
                return null;
            }

            var isOwner = parentPost.UserId == currentUserId;
            var preferences = await _db.UserPreferences
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.UserId == parentPost.UserId, cancellationToken);

            var relationStatus = isOwner
                ? FollowStatus.Accepted
                : await _db.UserFollows
                    .Where(x => x.FollowerId == currentUserId && x.FollowingId == parentPost.UserId)
                    .Select(x => (FollowStatus?)x.Status)
                    .FirstOrDefaultAsync(cancellationToken);

            if (!CanViewProfile(isOwner, preferences?.ProfileVisibility, relationStatus))
            {
                return null;
            }

            var reply = new UserPost
            {
                UserId = currentUserId,
                Type = PostType.Reply,
                ParentPostId = parentPostId,
                TextContent = request.TextContent.Trim(),
                PublishedAt = DateTime.UtcNow
            };

            _db.UserPosts.Add(reply);
            await _db.SaveChangesAsync(cancellationToken);

            var createdReply = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Attachments)
                .FirstAsync(x => x.Id == reply.Id, cancellationToken);

            return MapToReplyDto(createdReply);
        }

        private static IQueryable<UserPost> ApplyCursor(
            IQueryable<UserPost> query,
            (DateTime publishedAt, Guid id)? cursor)
        {
            if (!cursor.HasValue)
            {
                return query;
            }

            var (publishedAt, id) = cursor.Value;

            return query.Where(x =>
                x.PublishedAt < publishedAt ||
                (x.PublishedAt == publishedAt && x.Id != id));
        }

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

        private async Task<PostFeedDto> BuildFeedResponseAsync(
            List<UserPost> entities,
            int take,
            CancellationToken cancellationToken)
        {
            string? nextCursor = null;

            if (entities.Count > take)
            {
                var next = entities[take - 1];
                nextCursor = EncodeCursor(next.PublishedAt, next.Id);
                entities = entities.Take(take).ToList();
            }

            var postIds = entities.Select(x => x.Id).ToList();
            var replyCounts = postIds.Count == 0
                ? new Dictionary<Guid, int>()
                : await _db.UserPosts
                    .AsNoTracking()
                    .Where(x => x.ParentPostId.HasValue && postIds.Contains(x.ParentPostId.Value) && !x.IsDeleted)
                    .GroupBy(x => x.ParentPostId!.Value)
                    .ToDictionaryAsync(x => x.Key, x => x.Count(), cancellationToken);

            return new PostFeedDto
            {
                Items = entities.Select(entity =>
                {
                    var dto = MapToDto(entity);
                    dto.Stats.ReplyCount = replyCounts.GetValueOrDefault(entity.Id);
                    return dto;
                }).ToList(),
                NextCursor = nextCursor
            };
        }

        private static PostDto MapToDto(UserPost entity)
        {
            return new PostDto
            {
                Id = entity.Id,
                Actor = new PostActorDto
                {
                    Id = entity.UserId,
                    Username = entity.User?.Username ?? string.Empty,
                    AvatarUrl = entity.User?.AvatarUrl ?? string.Empty
                },
                Type = entity.Type,
                PublishedAt = entity.PublishedAt,
                UpdatedAt = entity.UpdatedAt,
                TextContent = entity.TextContent,
                ParentPostId = entity.ParentPostId,
                QuotedPostId = entity.QuotedPostId,
                Activity = entity.Activity == null ? null : ActivityDtoMapper.Map(entity.Activity),
                Attachments = entity.Attachments
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new PostAttachmentDto
                    {
                        Id = x.Id,
                        Type = x.Type,
                        Url = x.Url,
                        ThumbnailUrl = x.ThumbnailUrl,
                        SortOrder = x.SortOrder,
                        Width = x.Width,
                        Height = x.Height,
                        DurationSeconds = x.DurationSeconds
                    })
                    .ToList(),
                Replies = entity.Replies
                    .Where(x => !x.IsDeleted)
                    .OrderBy(x => x.PublishedAt)
                    .ThenBy(x => x.Id)
                    .Select(MapToReplyDto)
                    .ToList(),
                Stats = new PostStatsDto
                {
                    ReplyCount = entity.Replies.Count(x => !x.IsDeleted)
                }
            };
        }

        private static PostReplyDto MapToReplyDto(UserPost entity)
        {
            return new PostReplyDto
            {
                Id = entity.Id,
                Actor = new PostActorDto
                {
                    Id = entity.UserId,
                    Username = entity.User?.Username ?? string.Empty,
                    AvatarUrl = entity.User?.AvatarUrl ?? string.Empty
                },
                Type = entity.Type,
                PublishedAt = entity.PublishedAt,
                UpdatedAt = entity.UpdatedAt,
                TextContent = entity.TextContent,
                ParentPostId = entity.ParentPostId,
                QuotedPostId = entity.QuotedPostId,
                Activity = entity.Activity == null ? null : ActivityDtoMapper.Map(entity.Activity),
                Attachments = entity.Attachments
                    .OrderBy(x => x.SortOrder)
                    .Select(x => new PostAttachmentDto
                    {
                        Id = x.Id,
                        Type = x.Type,
                        Url = x.Url,
                        ThumbnailUrl = x.ThumbnailUrl,
                        SortOrder = x.SortOrder,
                        Width = x.Width,
                        Height = x.Height,
                        DurationSeconds = x.DurationSeconds
                    })
                    .ToList(),
                Stats = new PostStatsDto
                {
                    ReplyCount = entity.Replies.Count(x => !x.IsDeleted)
                }
            };
        }

        private async Task<List<PostReplyDto>> BuildReplyThreadAsync(Guid postId, CancellationToken cancellationToken)
        {
            const int childPreviewTake = 3;

            var rootReplies = await BuildReplyQuery()
                .Where(x => x.ParentPostId == postId && !x.IsDeleted)
                .OrderBy(x => x.PublishedAt)
                .ThenBy(x => x.Id)
                .ToListAsync(cancellationToken);

            if (rootReplies.Count == 0)
            {
                return [];
            }

            var rootIds = rootReplies.Select(x => x.Id).ToList();
            var childReplies = await BuildReplyQuery()
                .Where(x => x.ParentPostId.HasValue && rootIds.Contains(x.ParentPostId.Value) && !x.IsDeleted)
                .OrderBy(x => x.PublishedAt)
                .ThenBy(x => x.Id)
                .ToListAsync(cancellationToken);

            var childIds = childReplies.Select(x => x.Id).ToList();
            var grandchildCounts = childIds.Count == 0
                ? new Dictionary<Guid, int>()
                : await _db.UserPosts
                    .AsNoTracking()
                    .Where(x => x.ParentPostId.HasValue && childIds.Contains(x.ParentPostId.Value) && !x.IsDeleted)
                    .GroupBy(x => x.ParentPostId!.Value)
                    .ToDictionaryAsync(x => x.Key, x => x.Count(), cancellationToken);

            var childGroups = childReplies
                .GroupBy(x => x.ParentPostId!.Value)
                .ToDictionary(x => x.Key, x => x.ToList());

            return rootReplies.Select(reply =>
            {
                var dto = MapToReplyDto(reply);
                var children = childGroups.GetValueOrDefault(reply.Id) ?? [];

                dto.Stats.ReplyCount = children.Count;
                dto.Children = children
                    .Take(childPreviewTake)
                    .Select(child =>
                    {
                        var childDto = MapToReplyDto(child);
                        childDto.Stats.ReplyCount = grandchildCounts.GetValueOrDefault(child.Id);
                        return childDto;
                    })
                    .ToList();

                return dto;
            }).ToList();
        }

        private IQueryable<UserPost> BuildReplyQuery()
        {
            return _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments);
        }

        private static bool ShouldCreatePost(ActivityType type)
        {
            return type is
                ActivityType.EpisodeWatched or
                ActivityType.EpisodesWatchedBatch or
                ActivityType.SeasonCompleted or
                ActivityType.ShowCompleted or
                ActivityType.MovieWatched or
                ActivityType.MediaRated or
                ActivityType.MediaReviewAdded or
                ActivityType.GameCompleted or
                ActivityType.GameRated or
                ActivityType.GameReviewAdded or
                ActivityType.BookFinished or
                ActivityType.BookRated or
                ActivityType.BookReviewAdded;
        }

        private static int NormalizeTake(int take) => Math.Clamp(take, 1, 50);

        private static string EncodeCursor(DateTime publishedAt, Guid id)
        {
            var raw = $"{publishedAt.ToBinary()}|{id:D}";
            return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw));
        }

        private static (DateTime publishedAt, Guid id)? DecodeCursor(string? cursor)
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
