namespace Vivaply.API.Modules.Core.Social.Services.Interfaces
{
    public interface IActivityCleanupService
    {
        Task HideActivitiesForShowAsync(Guid userId, int tmdbShowId, CancellationToken cancellationToken = default);
        Task HideActivitiesForMovieAsync(Guid userId, int tmdbMovieId, CancellationToken cancellationToken = default);
        Task HideActivitiesForGameAsync(Guid userId, int igdbId, CancellationToken cancellationToken = default);
        Task HideActivitiesForBookAsync(Guid userId, string googleBookId, CancellationToken cancellationToken = default);
    }
}
