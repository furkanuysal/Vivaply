using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Dashboard;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Entities.Entertainment.Igdb;
using Vivaply.API.Entities.Knowledge;

namespace Vivaply.API.Services.Dashboard
{
    public class DashboardService : IDashboardService
    {
        private readonly VivaplyDbContext _dbContext;
        private const string TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

        public DashboardService(VivaplyDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<DashboardSummaryDto> GetDashboardSummaryAsync(Guid userId)
        {
            var response = new DashboardSummaryDto();

            // Tv shows (Continue Watching)
            var continueWatchingShows = await _dbContext.UserShows
                .Where(x =>
                    x.UserId == userId &&
                    x.Status == WatchStatus.Watching &&
                    x.LastWatchedAt != null
                )
                .OrderByDescending(x => x.LastWatchedAt)
                .Take(5)
                .Select(show => new DashboardItemDto
                {
                    Id = show.TmdbShowId.ToString(),
                    Type = "tv",
                    Title = show.ShowName,
                    ImageUrl = !string.IsNullOrEmpty(show.PosterPath)
                        ? TMDB_IMAGE_BASE + show.PosterPath
                        : null,

                    Season = show.LastWatchedSeason,
                    Episode = show.LastWatchedEpisode,

                    UserStatus = (int)show.Status,
                    LastUpdated = show.LastWatchedAt!.Value
                })
                .ToListAsync();

            response.ContinueWatching.AddRange(continueWatchingShows);


            // Games (Playing)
            var activeGames = await _dbContext.UserGames
                .Where(x => x.UserId == userId && x.Status == PlayStatus.Playing)
                .OrderByDescending(x => x.DateAdded)
                .Take(5)
                .ToListAsync();

            foreach (var game in activeGames)
            {
                response.ContinuePlaying.Add(new DashboardItemDto
                {
                    Id = game.IgdbId.ToString(),
                    Type = "game",
                    Title = game.Title,
                    ImageUrl = game.CoverUrl,
                    CurrentValue = game.UserPlaytime,
                    UserStatus = (int)game.Status,
                    LastUpdated = game.DateAdded
                });
            }

            // Books (Reading)
            var activeBooks = await _dbContext.UserBooks
                .Where(x => x.UserId == userId && x.Status == ReadStatus.Reading)
                .OrderByDescending(x => x.DateAdded)
                .Take(5)
                .ToListAsync();

            foreach (var book in activeBooks)
            {
                int percent = book.PageCount > 0 ? (int)((double)book.CurrentPage / book.PageCount * 100) : 0;

                response.ContinueReading.Add(new DashboardItemDto
                {
                    Id = book.GoogleBookId,
                    Type = "book",
                    Title = book.Title,
                    ImageUrl = book.CoverUrl,
                    CurrentValue = book.CurrentPage,
                    MaxValue = book.PageCount,
                    ProgressPercent = percent,
                    UserStatus = (int)book.Status,
                    LastUpdated = book.DateAdded
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
