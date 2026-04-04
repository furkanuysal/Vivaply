namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IPostCleanupService
    {
        Task HidePostsForShowAsync(Guid userId, int tmdbShowId, CancellationToken cancellationToken = default);
        Task HidePostsForMovieAsync(Guid userId, int tmdbMovieId, CancellationToken cancellationToken = default);
        Task HidePostsForGameAsync(Guid userId, int igdbId, CancellationToken cancellationToken = default);
        Task HidePostsForBookAsync(Guid userId, string googleBookId, CancellationToken cancellationToken = default);
    }
}
