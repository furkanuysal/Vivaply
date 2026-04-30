using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text;
using System.Text.RegularExpressions;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Notifications.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts;
using Vivaply.API.Modules.Core.Social.DTOs.Mappers;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Posts;
using Vivaply.API.Modules.Core.Social.Enums;
using Vivaply.API.Modules.Core.Social.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Social.Services.Implementations
{
    public class PostService(
        VivaplyDbContext db,
        IMemoryCache cache,
        IPostMediaStorageService postMediaStorageService,
        INotificationService notificationService) : IPostService
    {
        private const int ViewCooldownHours = 6;
        private static readonly Regex MentionRegex = new(
            @"(?<![A-Za-z0-9_])@(?<username>[A-Za-z0-9_]{1,50})",
            RegexOptions.Compiled | RegexOptions.CultureInvariant);
        private readonly VivaplyDbContext _db = db;
        private readonly IMemoryCache _cache = cache;
        private readonly IPostMediaStorageService _postMediaStorageService = postMediaStorageService;
        private readonly INotificationService _notificationService = notificationService;

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
                _db.PostStats.Add(new PostStats
                {
                    Post = existing
                });
            }
            else
            {
                existing.UserId = activity.UserId;
                existing.Type = PostType.Activity;
                existing.UpdatedAt = activity.OccurredAt;
                existing.IsDeleted = false;
                existing.DeletedAt = null;
            }

            await _db.SaveChangesAsync(cancellationToken);
        }

        public async Task<PostDto> CreateAsync(Guid currentUserId, CreatePostRequest request, CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;

            var post = new UserPost
            {
                UserId = currentUserId,
                Type = PostType.Standard,
                TextContent = NormalizeText(request.TextContent),
                IsSpoiler = request.IsSpoiler,
                LocationName = NormalizeText(request.LocationName),
                LocationLat = request.LocationLat,
                LocationLon = request.LocationLon,
                PublishedAt = now
            };

            foreach (var attachment in await _postMediaStorageService.SaveAsync(request.Files, cancellationToken))
            {
                post.Attachments.Add(attachment);
            }

            _db.UserPosts.Add(post);
            _db.PostStats.Add(new PostStats
            {
                Post = post,
                UpdatedAt = now
            });

            await _db.SaveChangesAsync(cancellationToken);
            var mentionUserIds = await SyncMentionsAsync(post, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _notificationService.CreateMentionNotificationsAsync(currentUserId, post.Id, mentionUserIds, cancellationToken);

            var createdPost = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Include(x => x.Stats)
                .FirstAsync(x => x.Id == post.Id, cancellationToken);

            var dto = MapToDto(createdPost);
            await EnrichPostDtosAsync(currentUserId, [dto], cancellationToken);

            return dto;
        }

        public async Task<PostDto?> UpdateAsync(Guid currentUserId, Guid postId, UpdatePostRequest request, CancellationToken cancellationToken = default)
        {
            var post = await _db.UserPosts
                .FirstOrDefaultAsync(x => x.Id == postId && !x.IsDeleted, cancellationToken);

            if (post == null || post.UserId != currentUserId)
            {
                return null;
            }

            if (post.Type is not (PostType.Standard or PostType.Quote or PostType.Reply))
            {
                return null;
            }

            var normalizedText = string.IsNullOrWhiteSpace(request.TextContent)
                ? null
                : request.TextContent.Trim();

            if (post.Type is PostType.Standard or PostType.Reply && string.IsNullOrWhiteSpace(normalizedText))
            {
                throw new ArgumentException("Post text is required.");
            }

            post.TextContent = normalizedText;
            if (request.IsSpoiler.HasValue)
            {
                post.IsSpoiler = request.IsSpoiler.Value;
            }
            post.UpdatedAt = DateTime.UtcNow;

            await _db.SaveChangesAsync(cancellationToken);
            var mentionUserIds = await SyncMentionsAsync(post, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _notificationService.CreateMentionNotificationsAsync(currentUserId, post.Id, mentionUserIds, cancellationToken);

            var updatedPost = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
                .FirstAsync(x => x.Id == post.Id, cancellationToken);

            var dto = MapToDto(updatedPost);
            await EnrichPostDtosAsync(currentUserId, [dto], cancellationToken);

            return dto;
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
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
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

            return await BuildFeedResponseAsync(currentUserId, items, take, cancellationToken);
        }

        public async Task<PostFeedDto> GetBookmarkedPostsAsync(Guid currentUserId, PostQuery query, CancellationToken cancellationToken = default)
        {
            query ??= new PostQuery();
            var take = NormalizeTake(query.Take);
            var cursor = DecodeCursor(query.Cursor);

            var followingIds = await _db.UserFollows
                .Where(x => x.FollowerId == currentUserId && x.Status == FollowStatus.Accepted)
                .Select(x => x.FollowingId)
                .ToListAsync(cancellationToken);

            IQueryable<PostBookmark> bookmarks = _db.PostBookmarks
                .AsNoTracking()
                .Include(x => x.Post)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.QuotedPost)
                        .ThenInclude(x => x!.User)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.QuotedPost)
                        .ThenInclude(x => x!.Activity)
                            .ThenInclude(x => x!.User)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.QuotedPost)
                        .ThenInclude(x => x!.Attachments)
                .Include(x => x.Post)
                    .ThenInclude(x => x!.Stats)
                .Where(x =>
                    x.UserId == currentUserId &&
                    x.Post != null &&
                    !x.Post.IsDeleted &&
                    x.Post.ParentPostId == null &&
                    (
                        x.Post.UserId == currentUserId ||
                        (!_db.UserPreferences.Any(p =>
                            p.UserId == x.Post.UserId &&
                            p.ProfileVisibility == ProfileVisibility.Private) &&
                         (
                            !_db.UserPreferences.Any(p =>
                                p.UserId == x.Post.UserId &&
                                p.ProfileVisibility == ProfileVisibility.FollowersOnly) ||
                            followingIds.Contains(x.Post.UserId)
                         ))
                    ));

            bookmarks = ApplyBookmarkCursor(bookmarks, cursor);

            var items = await bookmarks
                .OrderByDescending(x => x.CreatedAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return await BuildBookmarkedFeedResponseAsync(currentUserId, items, take, cancellationToken);
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
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
                .Where(x =>
                    x.UserId == targetUser.Id &&
                    !x.IsDeleted);

            posts = NormalizeProfileScope(query.Scope) switch
            {
                "content" => posts.Where(x => x.ActivityId != null && x.ParentPostId == null),
                "replies" => posts.Where(x => x.ParentPostId != null),
                "media" => posts.Where(x => x.Attachments.Any()),
                _ => posts.Where(x => x.ParentPostId == null && x.ActivityId == null)
            };

            posts = ApplyCursor(posts, cursor);

            var items = await posts
                .OrderByDescending(x => x.PublishedAt)
                .ThenByDescending(x => x.Id)
                .Take(take + 1)
                .ToListAsync(cancellationToken);

            return await BuildFeedResponseAsync(currentUserId, items, take, cancellationToken);
        }

        public async Task<PostDto?> GetByIdAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            var post = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
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

            var viewTracked = await TrackViewAsync(currentUserId, post, cancellationToken);
            var dto = MapToDto(post);
            if (viewTracked)
            {
                dto.Stats.ViewCount += 1;
            }

            dto.Replies = await BuildReplyThreadAsync(post.Id, cancellationToken);
            await EnrichPostDtosAsync(currentUserId, [dto], cancellationToken);

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
                TextContent = NormalizeText(request.TextContent),
                IsSpoiler = request.IsSpoiler,
                LocationName = NormalizeText(request.LocationName),
                LocationLat = request.LocationLat,
                LocationLon = request.LocationLon,
                PublishedAt = DateTime.UtcNow
            };

            foreach (var attachment in await _postMediaStorageService.SaveAsync(request.Files, cancellationToken))
            {
                reply.Attachments.Add(attachment);
            }

            _db.UserPosts.Add(reply);
            _db.PostStats.Add(new PostStats
            {
                Post = reply
            });

            await EnsurePostStatsAsync(parentPostId, cancellationToken);
            await _db.PostStats
                .Where(x => x.PostId == parentPostId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.ReplyCount, x => x.ReplyCount + 1)
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            var mentionUserIds = await SyncMentionsAsync(reply, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            await _notificationService.CreateReplyNotificationAsync(currentUserId, parentPost.UserId, reply.Id, cancellationToken);
            await _notificationService.CreateMentionNotificationsAsync(currentUserId, reply.Id, mentionUserIds, cancellationToken);

            var createdReply = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Attachments)
                .Include(x => x.Stats)
                .FirstAsync(x => x.Id == reply.Id, cancellationToken);

            return MapToReplyDto(createdReply);
        }

        public async Task<PostDto?> CreateQuoteAsync(
            Guid currentUserId,
            Guid quotedPostId,
            CreateQuotePostRequest request,
            CancellationToken cancellationToken = default)
        {
            if (!await CanViewPostAsync(currentUserId, quotedPostId, cancellationToken))
            {
                return null;
            }

            var quote = new UserPost
            {
                UserId = currentUserId,
                Type = PostType.Quote,
                QuotedPostId = quotedPostId,
                TextContent = NormalizeText(request.TextContent),
                IsSpoiler = request.IsSpoiler,
                LocationName = NormalizeText(request.LocationName),
                LocationLat = request.LocationLat,
                LocationLon = request.LocationLon,
                PublishedAt = DateTime.UtcNow
            };

            foreach (var attachment in await _postMediaStorageService.SaveAsync(request.Files, cancellationToken))
            {
                quote.Attachments.Add(attachment);
            }

            _db.UserPosts.Add(quote);
            _db.PostStats.Add(new PostStats
            {
                Post = quote
            });

            await EnsurePostStatsAsync(quotedPostId, cancellationToken);
            await _db.PostStats
                .Where(x => x.PostId == quotedPostId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.QuoteCount, x => x.QuoteCount + 1)
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

            await _db.SaveChangesAsync(cancellationToken);
            var mentionUserIds = await SyncMentionsAsync(quote, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);
            var quotedPostOwnerId = await _db.UserPosts
                .AsNoTracking()
                .Where(x => x.Id == quotedPostId)
                .Select(x => x.UserId)
                .FirstAsync(cancellationToken);
            await _notificationService.CreateQuoteNotificationAsync(currentUserId, quotedPostOwnerId, quote.Id, cancellationToken);
            await _notificationService.CreateMentionNotificationsAsync(currentUserId, quote.Id, mentionUserIds, cancellationToken);

            var createdQuote = await _db.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
                .FirstAsync(x => x.Id == quote.Id, cancellationToken);

            var dto = MapToDto(createdQuote);
            await EnrichPostDtosAsync(currentUserId, [dto], cancellationToken);

            return dto;
        }

        public async Task<PostDeletionDto?> DeleteAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            var post = await _db.UserPosts
                .Include(x => x.Attachments)
                .FirstOrDefaultAsync(x => x.Id == postId && !x.IsDeleted, cancellationToken);

            if (post == null || post.UserId != currentUserId)
            {
                return null;
            }

            var now = DateTime.UtcNow;
            var parentPostId = post.ParentPostId;
            var quotedPostId = post.QuotedPostId;

            post.IsDeleted = true;
            post.DeletedAt = now;
            post.UpdatedAt = now;

            var mentions = await _db.PostMentions
                .Where(x => x.PostId == postId)
                .ToListAsync(cancellationToken);

            if (mentions.Count > 0)
            {
                _db.PostMentions.RemoveRange(mentions);
            }

            int? parentReplyCount = null;
            int? quotedPostQuoteCount = null;

            if (parentPostId.HasValue)
            {
                await EnsurePostStatsAsync(parentPostId.Value, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == parentPostId.Value)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.ReplyCount, x => Math.Max(0, x.ReplyCount - 1))
                        .SetProperty(x => x.UpdatedAt, now), cancellationToken);

                parentReplyCount = await _db.PostStats
                    .Where(x => x.PostId == parentPostId.Value)
                    .Select(x => (int?)x.ReplyCount)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            if (quotedPostId.HasValue && post.Type == PostType.Quote)
            {
                await EnsurePostStatsAsync(quotedPostId.Value, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == quotedPostId.Value)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.QuoteCount, x => Math.Max(0, x.QuoteCount - 1))
                        .SetProperty(x => x.UpdatedAt, now), cancellationToken);

                quotedPostQuoteCount = await _db.PostStats
                    .Where(x => x.PostId == quotedPostId.Value)
                    .Select(x => (int?)x.QuoteCount)
                    .FirstOrDefaultAsync(cancellationToken);
            }

            await _db.SaveChangesAsync(cancellationToken);
            DeletePostMedia(post);

            return new PostDeletionDto
            {
                Id = postId,
                ParentPostId = parentPostId,
                ParentReplyCount = parentReplyCount,
                QuotedPostId = quotedPostId,
                QuotedPostQuoteCount = quotedPostQuoteCount
            };
        }

        private void DeletePostMedia(UserPost post)
        {
            foreach (var attachment in post.Attachments)
            {
                _postMediaStorageService.Delete(attachment.Url);

                if (!string.IsNullOrWhiteSpace(attachment.ThumbnailUrl))
                {
                    _postMediaStorageService.Delete(attachment.ThumbnailUrl);
                }
            }
        }

        public async Task<PostStatsDto?> LikeAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            if (!await CanViewPostAsync(currentUserId, postId, cancellationToken))
            {
                return null;
            }

            var exists = await _db.PostLikes
                .AnyAsync(x => x.PostId == postId && x.UserId == currentUserId, cancellationToken);

            if (!exists)
            {
                var postOwnerId = await _db.UserPosts
                    .AsNoTracking()
                    .Where(x => x.Id == postId)
                    .Select(x => x.UserId)
                    .FirstAsync(cancellationToken);

                _db.PostLikes.Add(new PostLike
                {
                    PostId = postId,
                    UserId = currentUserId
                });

                await _db.SaveChangesAsync(cancellationToken);
                await EnsurePostStatsAsync(postId, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == postId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.LikeCount, x => x.LikeCount + 1)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

                await _notificationService.CreateLikeNotificationAsync(currentUserId, postOwnerId, postId, cancellationToken);
            }

            return await BuildPostStatsAsync(postId, cancellationToken);
        }

        public async Task<PostStatsDto?> UnlikeAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            if (!await CanViewPostAsync(currentUserId, postId, cancellationToken))
            {
                return null;
            }

            var like = await _db.PostLikes
                .FirstOrDefaultAsync(x => x.PostId == postId && x.UserId == currentUserId, cancellationToken);

            if (like != null)
            {
                var postOwnerId = await _db.UserPosts
                    .AsNoTracking()
                    .Where(x => x.Id == postId)
                    .Select(x => x.UserId)
                    .FirstAsync(cancellationToken);

                _db.PostLikes.Remove(like);
                await _db.SaveChangesAsync(cancellationToken);
                await EnsurePostStatsAsync(postId, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == postId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.LikeCount, x => Math.Max(0, x.LikeCount - 1))
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

                await _notificationService.RemoveLikeNotificationAsync(currentUserId, postOwnerId, postId, cancellationToken);
            }

            return await BuildPostStatsAsync(postId, cancellationToken);
        }

        public async Task<PostStatsDto?> BookmarkAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            if (!await CanViewPostAsync(currentUserId, postId, cancellationToken))
            {
                return null;
            }

            var exists = await _db.PostBookmarks
                .AnyAsync(x => x.PostId == postId && x.UserId == currentUserId, cancellationToken);

            if (!exists)
            {
                _db.PostBookmarks.Add(new PostBookmark
                {
                    PostId = postId,
                    UserId = currentUserId
                });

                await _db.SaveChangesAsync(cancellationToken);
                await EnsurePostStatsAsync(postId, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == postId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.BookmarkCount, x => x.BookmarkCount + 1)
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);
            }

            return await BuildPostStatsAsync(postId, cancellationToken);
        }

        public async Task<PostStatsDto?> RemoveBookmarkAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default)
        {
            if (!await CanViewPostAsync(currentUserId, postId, cancellationToken))
            {
                return null;
            }

            var bookmark = await _db.PostBookmarks
                .FirstOrDefaultAsync(x => x.PostId == postId && x.UserId == currentUserId, cancellationToken);

            if (bookmark != null)
            {
                _db.PostBookmarks.Remove(bookmark);
                await _db.SaveChangesAsync(cancellationToken);
                await EnsurePostStatsAsync(postId, cancellationToken);
                await _db.PostStats
                    .Where(x => x.PostId == postId)
                    .ExecuteUpdateAsync(setters => setters
                        .SetProperty(x => x.BookmarkCount, x => Math.Max(0, x.BookmarkCount - 1))
                        .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);
            }

            return await BuildPostStatsAsync(postId, cancellationToken);
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

        private static IQueryable<PostBookmark> ApplyBookmarkCursor(
            IQueryable<PostBookmark> query,
            (DateTime publishedAt, Guid id)? cursor)
        {
            if (!cursor.HasValue)
            {
                return query;
            }

            var (createdAt, id) = cursor.Value;

            return query.Where(x =>
                x.CreatedAt < createdAt ||
                (x.CreatedAt == createdAt && x.Id != id));
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
            Guid currentUserId,
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

            var dtos = entities.Select(MapToDto).ToList();
            await EnrichPostDtosAsync(currentUserId, dtos, cancellationToken);

            return new PostFeedDto
            {
                Items = dtos,
                NextCursor = nextCursor
            };
        }

        private async Task<PostFeedDto> BuildBookmarkedFeedResponseAsync(
            Guid currentUserId,
            List<PostBookmark> entities,
            int take,
            CancellationToken cancellationToken)
        {
            string? nextCursor = null;

            if (entities.Count > take)
            {
                var next = entities[take - 1];
                nextCursor = EncodeCursor(next.CreatedAt, next.Id);
                entities = entities.Take(take).ToList();
            }

            var dtos = entities
                .Where(x => x.Post != null)
                .Select(x => MapToDto(x.Post!))
                .ToList();

            await EnrichPostDtosAsync(currentUserId, dtos, cancellationToken);

            return new PostFeedDto
            {
                Items = dtos,
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
                IsSpoiler = entity.IsSpoiler,
                Location = MapLocation(entity),
                ParentPostId = entity.ParentPostId,
                ParentPost = MapQuotedDto(entity.ParentPost),
                QuotedPostId = entity.QuotedPostId,
                QuotedPost = MapQuotedDto(entity.QuotedPost),
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
                Stats = MapStats(entity.Stats)
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
                IsSpoiler = entity.IsSpoiler,
                Location = MapLocation(entity),
                ParentPostId = entity.ParentPostId,
                ParentPost = MapQuotedDto(entity.ParentPost),
                QuotedPostId = entity.QuotedPostId,
                QuotedPost = MapQuotedDto(entity.QuotedPost),
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
                Stats = MapStats(entity.Stats)
            };
        }

        private static PostQuotedDto? MapQuotedDto(UserPost? entity)
        {
            if (entity == null || entity.IsDeleted)
            {
                return null;
            }

            return new PostQuotedDto
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
                IsSpoiler = entity.IsSpoiler,
                Location = MapLocation(entity),
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
                    .ToList()
            };
        }

        private static PostLocationDto? MapLocation(UserPost entity)
        {
            if (string.IsNullOrWhiteSpace(entity.LocationName))
            {
                return null;
            }

            return new PostLocationDto
            {
                DisplayName = entity.LocationName,
                Lat = entity.LocationLat,
                Lon = entity.LocationLon
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

            var childGroups = childReplies
                .GroupBy(x => x.ParentPostId!.Value)
                .ToDictionary(x => x.Key, x => x.ToList());

            return rootReplies.Select(reply =>
            {
                var dto = MapToReplyDto(reply);
                var children = childGroups.GetValueOrDefault(reply.Id) ?? [];

                dto.Children = children
                    .Take(childPreviewTake)
                    .Select(MapToReplyDto)
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
                .Include(x => x.Attachments)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.ParentPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats);
        }

        private async Task EnrichPostDtosAsync(Guid currentUserId, IEnumerable<PostDto> posts, CancellationToken cancellationToken)
        {
            var allPosts = FlattenPostStates(posts).ToList();
            if (allPosts.Count == 0)
            {
                return;
            }

            var postIds = allPosts.Select(x => x.Id).Distinct().ToList();

            var likedPostIds = await _db.PostLikes
                .AsNoTracking()
                .Where(x => x.UserId == currentUserId && postIds.Contains(x.PostId))
                .Select(x => x.PostId)
                .ToHashSetAsync(cancellationToken);

            var bookmarkedPostIds = await _db.PostBookmarks
                .AsNoTracking()
                .Where(x => x.UserId == currentUserId && postIds.Contains(x.PostId))
                .Select(x => x.PostId)
                .ToHashSetAsync(cancellationToken);

            foreach (var post in allPosts)
            {
                post.Viewer.HasLiked = likedPostIds.Contains(post.Id);
                post.Viewer.HasBookmarked = bookmarkedPostIds.Contains(post.Id);
            }
        }

        private static IEnumerable<PostStateTarget> FlattenPostStates(IEnumerable<PostDto> posts)
        {
            foreach (var post in posts)
            {
                yield return new PostStateTarget(post.Id, post.Stats, post.Viewer);

                foreach (var reply in FlattenReplyStates(post.Replies))
                {
                    yield return reply;
                }
            }
        }

        private static IEnumerable<PostStateTarget> FlattenReplyStates(IEnumerable<PostReplyDto> replies)
        {
            foreach (var reply in replies)
            {
                yield return new PostStateTarget(reply.Id, reply.Stats, reply.Viewer);

                foreach (var child in FlattenReplyStates(reply.Children))
                {
                    yield return child;
                }
            }
        }

        private sealed record PostStateTarget(Guid Id, PostStatsDto Stats, PostViewerStateDto Viewer);

        private async Task<bool> CanViewPostAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken)
        {
            var post = await _db.UserPosts
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == postId && !x.IsDeleted, cancellationToken);

            if (post == null)
            {
                return false;
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

            return CanViewProfile(isOwner, preferences?.ProfileVisibility, relationStatus);
        }

        private async Task<PostStatsDto> BuildPostStatsAsync(Guid postId, CancellationToken cancellationToken)
        {
            var stats = await _db.PostStats
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.PostId == postId, cancellationToken);

            return MapStats(stats);
        }

        private async Task<bool> TrackViewAsync(Guid currentUserId, UserPost post, CancellationToken cancellationToken)
        {
            if (post.UserId == currentUserId)
            {
                return false;
            }

            var cacheKey = $"post-view:{post.Id:D}:{currentUserId:D}";
            if (_cache.TryGetValue(cacheKey, out _))
            {
                return false;
            }

            await EnsurePostStatsAsync(post.Id, cancellationToken);
            await _db.PostStats
                .Where(x => x.PostId == post.Id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(x => x.ViewCount, x => x.ViewCount + 1)
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

            _cache.Set(
                cacheKey,
                true,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(ViewCooldownHours)
                });

            return true;
        }

        private static PostStatsDto MapStats(PostStats? stats)
        {
            return new PostStatsDto
            {
                ReplyCount = stats?.ReplyCount ?? 0,
                LikeCount = stats?.LikeCount ?? 0,
                QuoteCount = stats?.QuoteCount ?? 0,
                ViewCount = stats?.ViewCount ?? 0,
                BookmarkCount = stats?.BookmarkCount ?? 0
            };
        }

        private async Task EnsurePostStatsAsync(Guid postId, CancellationToken cancellationToken)
        {
            var exists = await _db.PostStats
                .AnyAsync(x => x.PostId == postId, cancellationToken);

            if (exists)
            {
                return;
            }

            _db.PostStats.Add(new PostStats
            {
                PostId = postId
            });

            await _db.SaveChangesAsync(cancellationToken);
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

        private static string NormalizeProfileScope(string? scope)
        {
            if (string.Equals(scope, "replies", StringComparison.OrdinalIgnoreCase))
            {
                return "replies";
            }

            if (string.Equals(scope, "content", StringComparison.OrdinalIgnoreCase))
            {
                return "content";
            }

            if (string.Equals(scope, "media", StringComparison.OrdinalIgnoreCase))
            {
                return "media";
            }

            return "posts";
        }

        private static string? NormalizeText(string? value)
        {
            return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        }

        private async Task<List<Guid>> SyncMentionsAsync(UserPost post, CancellationToken cancellationToken)
        {
            var existingMentions = await _db.PostMentions
                .Where(x => x.PostId == post.Id)
                .ToListAsync(cancellationToken);

            if (existingMentions.Count > 0)
            {
                _db.PostMentions.RemoveRange(existingMentions);
            }

            var usernames = ExtractMentionUsernames(post.TextContent);
            if (usernames.Count == 0)
            {
                return [];
            }

            var loweredUsernames = usernames
                .Select(x => x.ToLowerInvariant())
                .ToList();

            var matchedUsers = await _db.Users
                .AsNoTracking()
                .Where(x => loweredUsernames.Contains(x.Username.ToLower()) && x.Id != post.UserId)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            if (matchedUsers.Count == 0)
            {
                return [];
            }

            _db.PostMentions.AddRange(matchedUsers.Select(userId => new PostMention
            {
                PostId = post.Id,
                MentionedUserId = userId,
                CreatedAt = post.UpdatedAt ?? post.PublishedAt
            }));

            return matchedUsers;
        }

        private static List<string> ExtractMentionUsernames(string? textContent)
        {
            if (string.IsNullOrWhiteSpace(textContent))
            {
                return [];
            }

            return MentionRegex
                .Matches(textContent)
                .Select(x => x.Groups["username"].Value)
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
        }

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
