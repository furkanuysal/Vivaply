using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Identity.Enums;
using Vivaply.API.Modules.Core.Search.DTOs.Queries;
using Vivaply.API.Modules.Core.Search.DTOs.Results;
using Vivaply.API.Modules.Core.Search.Services.Interfaces;
using Vivaply.API.Modules.Core.Social.DTOs.Mappers;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Posts;
using Vivaply.API.Modules.Core.Social.Enums;

namespace Vivaply.API.Modules.Core.Search.Services.Implementations
{
    public class SearchService(VivaplyDbContext dbContext) : ISearchService
    {
        private const int MinQueryLength = 2;
        private const int MaxTake = 20;
        private readonly VivaplyDbContext _dbContext = dbContext;

        public async Task<GlobalSearchResponseDto> SearchAsync(
            Guid currentUserId,
            SearchQuery query,
            CancellationToken cancellationToken = default)
        {
            var normalizedQuery = NormalizeQuery(query.Query);
            if (normalizedQuery == null)
            {
                return new GlobalSearchResponseDto();
            }

            var take = NormalizeTake(query.Take);
            var userResults = await SearchUsersInternalAsync(currentUserId, normalizedQuery, take, cancellationToken);
            var postResults = await SearchPostsInternalAsync(currentUserId, normalizedQuery, take, cancellationToken);

            return new GlobalSearchResponseDto
            {
                Users = userResults,
                Posts = postResults
            };
        }

        public async Task<SearchUsersResponseDto> SearchUsersAsync(
            Guid currentUserId,
            SearchQuery query,
            CancellationToken cancellationToken = default)
        {
            var normalizedQuery = NormalizeQuery(query.Query);
            if (normalizedQuery == null)
            {
                return new SearchUsersResponseDto();
            }

            return new SearchUsersResponseDto
            {
                Items = await SearchUsersInternalAsync(
                    currentUserId,
                    normalizedQuery,
                    NormalizeTake(query.Take),
                    cancellationToken)
            };
        }

        public async Task<SearchPostsResponseDto> SearchPostsAsync(
            Guid currentUserId,
            SearchQuery query,
            CancellationToken cancellationToken = default)
        {
            var normalizedQuery = NormalizeQuery(query.Query);
            if (normalizedQuery == null)
            {
                return new SearchPostsResponseDto();
            }

            return new SearchPostsResponseDto
            {
                Items = await SearchPostsInternalAsync(
                    currentUserId,
                    normalizedQuery,
                    NormalizeTake(query.Take),
                    cancellationToken)
            };
        }

        private async Task<List<SearchUserDto>> SearchUsersInternalAsync(
            Guid currentUserId,
            string normalizedQuery,
            int take,
            CancellationToken cancellationToken)
        {
            var pattern = $"%{normalizedQuery}%";
            var startsWithPattern = $"{normalizedQuery}%";
            var lowerQuery = normalizedQuery.ToLowerInvariant();
            var followingIds = await GetAcceptedFollowingIdsAsync(currentUserId, cancellationToken);

            return await _dbContext.Users
                .AsNoTracking()
                .Where(user =>
                    (EF.Functions.ILike(user.Username, pattern) ||
                     EF.Functions.TrigramsAreSimilar(user.Username.ToLower(), lowerQuery)) &&
                    (user.Id == currentUserId ||
                     user.Preferences == null ||
                     user.Preferences.ProfileVisibility == ProfileVisibility.Public ||
                     (user.Preferences.ProfileVisibility == ProfileVisibility.FollowersOnly &&
                      followingIds.Contains(user.Id))))
                .OrderByDescending(user => EF.Functions.ILike(user.Username, normalizedQuery))
                .ThenByDescending(user => EF.Functions.ILike(user.Username, startsWithPattern))
                .ThenByDescending(user => EF.Functions.TrigramsSimilarity(user.Username.ToLower(), lowerQuery))
                .ThenBy(user => user.Username)
                .Take(take)
                .Select(user => new SearchUserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    AvatarUrl = user.AvatarUrl,
                    Bio = user.Profile != null ? user.Profile.Bio : null,
                    IsCurrentUser = user.Id == currentUserId,
                    RelationStatus = user.Id == currentUserId
                        ? FollowStatus.Accepted
                        : _dbContext.UserFollows
                            .Where(follow =>
                                follow.FollowerId == currentUserId &&
                                follow.FollowingId == user.Id)
                            .Select(follow => (FollowStatus?)follow.Status)
                            .FirstOrDefault(),
                    IsFollowingCurrentUser =
                        user.Id != currentUserId &&
                        _dbContext.UserFollows.Any(follow =>
                            follow.FollowerId == user.Id &&
                            follow.FollowingId == currentUserId &&
                            follow.Status == FollowStatus.Accepted),
                    FollowersCount = _dbContext.UserFollows.Count(follow =>
                        follow.FollowingId == user.Id &&
                        follow.Status == FollowStatus.Accepted),
                    FollowingCount = _dbContext.UserFollows.Count(follow =>
                        follow.FollowerId == user.Id &&
                        follow.Status == FollowStatus.Accepted)
                })
                .ToListAsync(cancellationToken);
        }

        private async Task<List<PostDto>> SearchPostsInternalAsync(
            Guid currentUserId,
            string normalizedQuery,
            int take,
            CancellationToken cancellationToken)
        {
            var followingIds = await GetAcceptedFollowingIdsAsync(currentUserId, cancellationToken);
            var lowerQuery = normalizedQuery.ToLowerInvariant();
            var containsPattern = $"%{lowerQuery}%";
            var startsWithPattern = $"{lowerQuery}%";

            var posts = await _dbContext.UserPosts
                .AsNoTracking()
                .Include(x => x.User)
                .Include(x => x.Activity)
                    .ThenInclude(x => x!.User)
                .Include(x => x.Attachments)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Activity)
                        .ThenInclude(x => x!.User)
                .Include(x => x.QuotedPost)
                    .ThenInclude(x => x!.Attachments)
                .Include(x => x.Stats)
                .Where(post =>
                    !post.IsDeleted &&
                    post.Type != PostType.Activity &&
                    !string.IsNullOrWhiteSpace(post.TextContent) &&
                    (EF.Functions.ToTsVector("simple", post.TextContent!)
                        .Matches(EF.Functions.WebSearchToTsQuery("simple", normalizedQuery)) ||
                     EF.Functions.Like(post.TextContent!.ToLower(), containsPattern)) &&
                    (post.UserId == currentUserId ||
                     post.User!.Preferences == null ||
                     post.User.Preferences.ProfileVisibility == ProfileVisibility.Public ||
                     (post.User.Preferences.ProfileVisibility == ProfileVisibility.FollowersOnly &&
                      followingIds.Contains(post.UserId))))
                .OrderByDescending(post => post.TextContent!.ToLower() == lowerQuery)
                .ThenByDescending(post => EF.Functions.Like(post.TextContent!.ToLower(), startsWithPattern))
                .ThenByDescending(post => EF.Functions.Like(post.TextContent!.ToLower(), containsPattern))
                .ThenByDescending(post => EF.Functions.ToTsVector("simple", post.TextContent!)
                    .Rank(EF.Functions.WebSearchToTsQuery("simple", normalizedQuery)))
                .ThenByDescending(post => post.PublishedAt)
                .ThenByDescending(post => post.Id)
                .Take(take)
                .ToListAsync(cancellationToken);

            var items = posts.Select(MapToDto).ToList();
            await EnrichPostDtosAsync(currentUserId, items, cancellationToken);
            return items;
        }

        private async Task<List<Guid>> GetAcceptedFollowingIdsAsync(Guid currentUserId, CancellationToken cancellationToken)
        {
            return await _dbContext.UserFollows
                .Where(follow =>
                    follow.FollowerId == currentUserId &&
                    follow.Status == FollowStatus.Accepted)
                .Select(follow => follow.FollowingId)
                .ToListAsync(cancellationToken);
        }

        private static string? NormalizeQuery(string? query)
        {
            var normalized = query?.Trim();
            return string.IsNullOrWhiteSpace(normalized) || normalized.Length < MinQueryLength
                ? null
                : normalized;
        }

        private static int NormalizeTake(int take)
        {
            return take <= 0 ? 8 : Math.Min(take, MaxTake);
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
                Replies = [],
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

        private static PostStatsDto MapStats(PostStats? stats)
        {
            if (stats == null)
            {
                return new PostStatsDto();
            }

            return new PostStatsDto
            {
                ReplyCount = stats.ReplyCount,
                LikeCount = stats.LikeCount,
                QuoteCount = stats.QuoteCount,
                ViewCount = stats.ViewCount,
                BookmarkCount = stats.BookmarkCount
            };
        }

        private async Task EnrichPostDtosAsync(Guid currentUserId, IEnumerable<PostDto> posts, CancellationToken cancellationToken)
        {
            var postIds = posts
                .Select(post => post.Id)
                .Distinct()
                .ToList();

            if (postIds.Count == 0)
            {
                return;
            }

            var likedPostIds = await _dbContext.PostLikes
                .Where(like => like.UserId == currentUserId && postIds.Contains(like.PostId))
                .Select(like => like.PostId)
                .ToListAsync(cancellationToken);

            var bookmarkedPostIds = await _dbContext.PostBookmarks
                .Where(bookmark => bookmark.UserId == currentUserId && postIds.Contains(bookmark.PostId))
                .Select(bookmark => bookmark.PostId)
                .ToListAsync(cancellationToken);

            var likedSet = likedPostIds.ToHashSet();
            var bookmarkedSet = bookmarkedPostIds.ToHashSet();

            foreach (var post in posts)
            {
                post.Viewer = new PostViewerStateDto
                {
                    HasLiked = likedSet.Contains(post.Id),
                    HasBookmarked = bookmarkedSet.Contains(post.Id)
                };
            }
        }
    }
}
