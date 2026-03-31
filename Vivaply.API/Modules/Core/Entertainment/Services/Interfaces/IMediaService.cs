using Vivaply.API.Modules.Core.Entertainment.DTOs.Commands.Media;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Library;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results.Media;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Interfaces
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
    }
}
