using Vivaply.API.DTOs.Entertainment.Commands.Media;
using Vivaply.API.DTOs.Entertainment.Results.Library;
using Vivaply.API.DTOs.Entertainment.Results.Media;
using Vivaply.API.DTOs.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Media
{
    public interface IMediaService
    {
        // -------- LIBRARY --------

        Task<MediaLibraryDto> GetUserLibraryAsync(Guid userId);

        Task AddMediaToLibraryAsync(
            Guid userId,
            AddMediaToLibraryDto request
        );

        Task RemoveMediaFromLibraryAsync(
            Guid userId,
            int tmdbId,
            string type
        );


        // -------- DETAILS --------

        Task<TmdbShowDetailDto?> GetTvShowDetailAsync(
            Guid? userId,
            int tmdbId,
            string language
        );

        Task<TmdbContentDto?> GetMovieDetailAsync(
            Guid? userId,
            int tmdbId,
            string language
        );

        Task<TmdbSeasonDetailDto?> GetSeasonDetailAsync(
         Guid? userId,
         int tmdbShowId,
         int seasonNumber,
         string language
        );

        // -------- STATUS / PROGRESS --------

        Task UpdateMediaStatusAsync(
            Guid userId,
            UpdateMediaStatusDto request
        );

        Task UpdateMediaProgressAsync(
            Guid userId,
            UpdateMediaProgressDto request
        );


        // -------- EPISODES (TV ONLY) --------

        Task<ToggleEpisodeResultDto> ToggleEpisodeAsync(
            Guid userId,
            int tmdbShowId,
            int seasonNumber,
            int episodeNumber
        );

        Task<MarkSeasonResultDto> MarkSeasonWatchedAsync(
            Guid userId,
            int tmdbShowId,
            int seasonNumber
        );

        Task<WatchNextEpisodeResultDto> WatchNextEpisodeAsync(
            Guid userId,
            int tmdbShowId
        );


        // -------- RATING / REVIEW --------

        Task RateMediaAsync(
            Guid userId,
            RateMediaDto request
        );

        Task AddMediaReviewAsync(
            Guid userId,
            AddMediaReviewDto request
        );


        // -------- MAINTENANCE --------

        Task<int> FixBrokenMediaDataAsync();

        Task<int> SyncMediaLibraryAsync(Guid userId);
    }
}
