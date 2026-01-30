using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Entertainment.Recommendation;
using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Services.Entertainment.Tmdb;

namespace Vivaply.API.Services.Entertainment.Recommendation
{
    public class RecommendationService : IRecommendationService
    {
        private readonly VivaplyDbContext _db;
        private readonly ITmdbService _tmdb;

        public RecommendationService(VivaplyDbContext db, ITmdbService tmdb)
        {
            _db = db;
            _tmdb = tmdb;
        }

        public async Task<RecommendationResponseDto> GetRecommendationsAsync(Guid userId, string language = "en-US")
        {
            // --- TV ---
            var longTermTv = await BuildUserGenreProfileTv(userId);
            var recentTv = await BuildRecentGenreProfileTv(userId);
            var finalTvProfile = MergeProfiles(longTermTv, recentTv);

            var topTvGenres = finalTvProfile
                .Take(3)
                .Select(x => x.Key)
                .ToList();

            // --- MOVIE ---
            var longTermMovie = await BuildUserGenreProfileMovie(userId);
            var recentMovie = await BuildRecentGenreProfileMovie(userId);
            var finalMovieProfile = MergeProfiles(longTermMovie, recentMovie);

            var topMovieGenres = finalMovieProfile
                .Take(3)
                .Select(x => x.Key)
                .ToList();


            // Discover
            var recommendedTv = topTvGenres.Any()
                ? await _tmdb.DiscoverTvAsync(string.Join(",", topTvGenres), language)
                : new List<TmdbContentDto>();

            var recommendedMovies = topMovieGenres.Any()
                ? await _tmdb.DiscoverMoviesAsync(string.Join(",", topMovieGenres), language)
                : new List<TmdbContentDto>();

            // Watched filter
            var watchedTvIds = await _db.UserShows
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbShowId)
                .ToListAsync();

            var watchedMovieIds = await _db.UserMovies
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbMovieId)
                .ToListAsync();

            recommendedTv = recommendedTv
                .Where(x => !watchedTvIds.Contains(x.Id))
                .OrderByDescending(x => ScoreItem(x, finalTvProfile))
                .Take(20)
                .ToList();

            recommendedMovies = recommendedMovies
                .Where(x => !watchedMovieIds.Contains(x.Id))
                .OrderByDescending(x => ScoreItem(x, finalMovieProfile))
                .Take(20)
                .ToList();

            return new RecommendationResponseDto
            {
                Tv = recommendedTv,
                Movies = recommendedMovies
            };
        }


        // ---------------- PROFILE BUILDERS ----------------

        // TV Long-term profile builder
        private async Task<Dictionary<int, double>> BuildUserGenreProfileTv(Guid userId)
        {
            var userShows = await _db.UserShows
                .Where(x => x.UserId == userId &&
                       (x.Status == WatchStatus.Watching ||
                        x.Status == WatchStatus.Completed))
                .ToListAsync();

            var scores = new Dictionary<int, double>();

            foreach (var show in userShows)
            {
                var detail = await _tmdb.GetTvShowDetailsAsync(show.TmdbShowId);
                if (detail?.Genres == null) continue;

                foreach (var genre in detail.Genres)
                {
                    if (!scores.ContainsKey(genre.Id))
                        scores[genre.Id] = 0;

                    var weight = show.Status == WatchStatus.Completed ? 2 : 1;
                    scores[genre.Id] += weight;
                }
            }

            return Normalize(scores);
        }
        // Recent TV profile builder
        private async Task<Dictionary<int, double>> BuildRecentGenreProfileTv(Guid userId)
        {
            var recentShows = await _db.UserShows
                .Where(x => x.UserId == userId && x.LastWatchedAt != null)
                .OrderByDescending(x => x.LastWatchedAt)
                .Take(5)
                .ToListAsync();

            var scores = new Dictionary<int, double>();

            foreach (var show in recentShows)
            {
                var detail = await _tmdb.GetTvShowDetailsAsync(show.TmdbShowId);
                if (detail?.Genres == null) continue;

                foreach (var genre in detail.Genres)
                {
                    if (!scores.ContainsKey(genre.Id))
                        scores[genre.Id] = 0;

                    // recency boost
                    scores[genre.Id] += 2;
                }
            }

            return Normalize(scores);
        }

        // Movie long-term profile builder
        private async Task<Dictionary<int, double>> BuildUserGenreProfileMovie(Guid userId)
        {
            var userMovies = await _db.UserMovies
                .Where(x => x.UserId == userId &&
                       (x.Status == WatchStatus.Watching ||
                        x.Status == WatchStatus.Completed))
                .ToListAsync();

            var scores = new Dictionary<int, double>();

            foreach (var movie in userMovies)
            {
                var detail = await _tmdb.GetMovieDetailsAsync(movie.TmdbMovieId);
                if (detail?.Genres == null) continue;

                foreach (var genre in detail.Genres)
                {
                    if (!scores.ContainsKey(genre.Id))
                        scores[genre.Id] = 0;

                    var weight = movie.Status == WatchStatus.Completed ? 2 : 1;
                    scores[genre.Id] += weight;
                }
            }

            return Normalize(scores);
        }

        // Recent movie profile builder
        private async Task<Dictionary<int, double>> BuildRecentGenreProfileMovie(Guid userId)
        {
            var recentMovies = await _db.UserMovies
                .Where(x => x.UserId == userId && x.WatchedAt != null)
                .OrderByDescending(x => x.WatchedAt)
                .Take(5)
                .ToListAsync();

            var scores = new Dictionary<int, double>();

            foreach (var movie in recentMovies)
            {
                var detail = await _tmdb.GetMovieDetailsAsync(movie.TmdbMovieId);
                if (detail?.Genres == null) continue;

                foreach (var genre in detail.Genres)
                {
                    if (!scores.ContainsKey(genre.Id))
                        scores[genre.Id] = 0;

                    scores[genre.Id] += 2;
                }
            }

            return Normalize(scores);
        }

        private Dictionary<int, double> MergeProfiles(
            Dictionary<int, double> longTerm,
            Dictionary<int, double> recent)
        {
            var result = new Dictionary<int, double>();

            var allGenres = longTerm.Keys
                .Union(recent.Keys)
                .ToList();

            foreach (var genreId in allGenres)
            {
                var longScore = longTerm.ContainsKey(genreId) ? longTerm[genreId] : 0;
                var recentScore = recent.ContainsKey(genreId) ? recent[genreId] : 0;

                result[genreId] = (longScore * 0.7) + (recentScore * 0.3);
            }

            return result
                .OrderByDescending(x => x.Value)
                .ToDictionary(x => x.Key, x => x.Value);
        }

        // Score an item based on the user's genre profile
        private double ScoreItem(TmdbContentDto item, Dictionary<int, double> profile)
        {
            if (item.Genres == null || item.Genres.Count == 0)
                return 0;

            return item.Genres.Sum(g =>
                profile.ContainsKey(g.Id) ? profile[g.Id] : 0
            );
        }

        //Normalize scores to 0-1 range
        private Dictionary<int, double> Normalize(Dictionary<int, double> scores)
        {
            var max = scores.Values.DefaultIfEmpty(1).Max();
            if (max == 0) max = 1;

            return scores.ToDictionary(
                x => x.Key,
                x => x.Value / max
            );
        }

    }
}
