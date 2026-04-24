using Vivaply.API.Modules.Core.Search.DTOs.Queries;
using Vivaply.API.Modules.Core.Search.DTOs.Results;

namespace Vivaply.API.Modules.Core.Search.Services.Interfaces
{
    public interface ISearchService
    {
        Task<GlobalSearchResponseDto> SearchAsync(Guid currentUserId, SearchQuery query, CancellationToken cancellationToken = default);
        Task<SearchUsersResponseDto> SearchUsersAsync(Guid currentUserId, SearchQuery query, CancellationToken cancellationToken = default);
        Task<SearchPostsResponseDto> SearchPostsAsync(Guid currentUserId, SearchQuery query, CancellationToken cancellationToken = default);
    }
}
