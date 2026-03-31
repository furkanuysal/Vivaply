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

            // Tv shows (Continue Watching)
            var continueWatchingShows = await _dbContext.UserShows
                .Where(x =>
                    x.UserId == userId &&
                    x.Status == WatchStatus.Watching &&
                    x.LastWatchedAt != null
                )
                .OrderByDescending(x => x.LastWatchedAt)
                .Take(5)
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
                    LastUpdated = show.LastWatchedAt!.Value
                })
                .ToListAsync();

            response.ContinueWatching.AddRange(continueWatchingShows);


            // Games (Playing)
            var activeGames = await _dbContext.UserGames
                .Where(x => x.UserId == userId && x.Status == PlayStatus.Playing)
                .OrderByDescending(x => x.DateAdded)
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
                    LastUpdated = game.DateAdded
                });
            }

            // Books (Reading)
            var activeBooks = await _dbContext.UserBooks
                .Where(x => x.UserId == userId && x.Status == ReadStatus.Reading)
                .OrderByDescending(x => x.DateAdded)
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
