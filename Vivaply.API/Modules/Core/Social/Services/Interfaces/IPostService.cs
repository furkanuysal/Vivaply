using Vivaply.API.Entities.Identity;
using Vivaply.API.Modules.Core.Social.DTOs.Commands.Posts;
using Vivaply.API.Modules.Core.Social.DTOs.Queries;
using Vivaply.API.Modules.Core.Social.DTOs.Results.Posts;

namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IPostService
    {
        Task SyncActivityPostAsync(UserActivity activity, CancellationToken cancellationToken = default);
        Task<PostDto> CreateAsync(Guid currentUserId, CreatePostRequest request, CancellationToken cancellationToken = default);
        Task<PostDto?> UpdateAsync(Guid currentUserId, Guid postId, UpdatePostRequest request, CancellationToken cancellationToken = default);
        Task<PostFeedDto> GetFeedAsync(Guid currentUserId, PostQuery query, CancellationToken cancellationToken = default);
        Task<PostFeedDto> GetBookmarkedPostsAsync(Guid currentUserId, PostQuery query, CancellationToken cancellationToken = default);
        Task<PostFeedDto> GetProfilePostsAsync(Guid currentUserId, string username, PostQuery query, CancellationToken cancellationToken = default);
        Task<PostDto?> GetByIdAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
        Task<PostReplyDto?> CreateReplyAsync(Guid currentUserId, Guid parentPostId, CreateReplyPostRequest request, CancellationToken cancellationToken = default);
        Task<PostDto?> CreateQuoteAsync(Guid currentUserId, Guid quotedPostId, CreateQuotePostRequest request, CancellationToken cancellationToken = default);
        Task<PostDeletionDto?> DeleteAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
        Task<PostStatsDto?> LikeAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
        Task<PostStatsDto?> UnlikeAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
        Task<PostStatsDto?> BookmarkAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
        Task<PostStatsDto?> RemoveBookmarkAsync(Guid currentUserId, Guid postId, CancellationToken cancellationToken = default);
    }
}
