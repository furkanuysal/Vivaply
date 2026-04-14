using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Modules.Core.Dashboard.DTOs;
using Vivaply.API.Modules.Core.Dashboard.Enums;
using Vivaply.API.Modules.Core.Dashboard.Services.Interfaces;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Knowledge.Enums;

namespace Vivaply.API.Modules.Core.Dashboard.Services.Implementations
{
    public class DashboardService(VivaplyDbContext dbContext) : IDashboardService
    {
        private readonly VivaplyDbContext _dbContext = dbContext;
        private const string TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid userId)
        {
            var response = new DashboardSummaryDto();

            // Recently watched shows
            var recentShows = await _dbContext.UserShows
                .Where(x =>
                    x.UserId == userId &&
                    x.LastWatchedAt != null
                )
                .OrderByDescending(x => x.LastWatchedAt)
                .Select(show => new DashboardContentItemDto
                {
                    Id = show.TmdbShowId.ToString(),
                    Type = DashboardItemType.Tv,
                    Title = show.Metadata!.Name,
                    ImageUrl = !string.IsNullOrEmpty(show.Metadata!.PosterPath)
                        ? TMDB_IMAGE_BASE + show.Metadata.PosterPath
                        : null,

                    Season = show.LastWatchedSeason,
                    Episode = show.LastWatchedEpisode,

                    UserStatus = (int)show.Status,
                    ProgressPercent = show.Status == WatchStatus.Completed ? 100 : null,
                    LastUpdated = show.LastWatchedAt!.Value
                })
                .ToListAsync();

            var recentMovies = await _dbContext.UserMovies
                .Where(x =>
                    x.UserId == userId &&
                    x.WatchedAt != null
                )
                .OrderByDescending(x => x.WatchedAt)
                .Select(movie => new DashboardContentItemDto
                {
                    Id = movie.TmdbMovieId.ToString(),
                    Type = DashboardItemType.Movie,
                    Title = movie.Metadata!.Title,
                    ImageUrl = !string.IsNullOrEmpty(movie.Metadata!.PosterPath)
                        ? TMDB_IMAGE_BASE + movie.Metadata.PosterPath
                        : null,
                    UserStatus = (int)movie.Status,
                    ProgressPercent = movie.Status == WatchStatus.Completed ? 100 : null,
                    LastUpdated = movie.WatchedAt!.Value
                })
                .ToListAsync();

            response.ContinueWatching.AddRange(recentShows
                .Concat(recentMovies)
                .OrderByDescending(x => x.LastUpdated)
                .Take(5));


            // Games (recent activity, including completed)
            var activeGames = await _dbContext.UserGames
                .Where(x =>
                    x.UserId == userId &&
                    x.Status != PlayStatus.None &&
                    x.Status != PlayStatus.PlanToPlay)
                .OrderByDescending(x => x.DateFinished ?? x.DateAdded)
                .Take(5)
                .Include(x => x.Metadata)
                .ToListAsync();

            foreach (var game in activeGames)
            {
                response.ContinuePlaying.Add(new DashboardContentItemDto
                {
                    Id = game.IgdbId.ToString(),
                    Type = DashboardItemType.Game,
                    Title = game.Metadata?.Title ?? "(Unknown)",
                    ImageUrl = game.Metadata?.CoverUrl,
                    CurrentValue = game.UserPlaytime,
                    UserStatus = (int)game.Status,
                    LastUpdated = game.DateFinished ?? game.DateAdded
                });
            }

            // Books (recent activity, including completed)
            var activeBooks = await _dbContext.UserBooks
                .Where(x =>
                    x.UserId == userId &&
                    x.Status != ReadStatus.None &&
                    x.Status != ReadStatus.PlanToRead)
                .OrderByDescending(x => x.DateFinished ?? x.DateAdded)
                .Take(5)
                .Include(x => x.Metadata)
                .ToListAsync();

            foreach (var book in activeBooks)
            {
                var pageCount = book.Metadata?.PageCount ?? 0;
                int percent = pageCount > 0 ? (int)((double)book.CurrentPage / pageCount * 100) : 0;

                response.ContinueReading.Add(new DashboardContentItemDto
                {
                    Id = book.GoogleBookId,
                    Type = DashboardItemType.Book,
                    Title = book.Metadata?.Title ?? "(Unknown)",
                    ImageUrl = book.Metadata?.CoverUrl,
                    CurrentValue = book.CurrentPage,
                    MaxValue = pageCount,
                    ProgressPercent = book.Status == ReadStatus.Completed ? 100 : percent,
                    UserStatus = (int)book.Status,
                    LastUpdated = book.DateFinished ?? book.DateAdded
                });
            }

            // Stats
            response.Stats.TotalMovies = await _dbContext.UserMovies.CountAsync(x => x.UserId == userId && x.Status == WatchStatus.Completed);
            response.Stats.TotalBooks = await _dbContext.UserBooks.CountAsync(x => x.UserId == userId && x.Status == ReadStatus.Completed);
            response.Stats.TotalGames = await _dbContext.UserGames.CountAsync(x => x.UserId == userId && x.Status == PlayStatus.Completed);
            response.Stats.TotalEpisodes = await _dbContext.WatchedEpisodes.CountAsync(x => x.UserShow!.UserId == userId);

            var profile = await _dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
            response.Stats.CurrentStreak = profile?.CurrentStreak ?? 0;

            return response;
        }
    }
}
