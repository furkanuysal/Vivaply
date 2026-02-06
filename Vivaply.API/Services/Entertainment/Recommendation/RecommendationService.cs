using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.DTOs.Entertainment.Recommendation;
using Vivaply.API.DTOs.Entertainment.Tmdb;
using Vivaply.API.Entities.Entertainment;
using Vivaply.API.Services.Entertainment.Recommendation.Helpers;
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
            var tvProfile = await BuildUserGenreProfileTv(userId);
            var movieProfile = await BuildUserGenreProfileMovie(userId);

            var topTvGenres = tvProfile
                .OrderByDescending(x => x.Value)
                .Take(3)
                .Select(x => x.Key)
                .ToList();

            var topMovieGenres = movieProfile
                .OrderByDescending(x => x.Value)
                .Take(3)
                .Select(x => x.Key)
                .ToList();

            var tvCandidates = topTvGenres.Any()
                ? await _tmdb.DiscoverTvAsync(string.Join(",", topTvGenres), language)
                : new List<TmdbContentDto>();

            var movieCandidates = topMovieGenres.Any()
                ? await _tmdb.DiscoverMoviesAsync(string.Join(",", topMovieGenres), language)
                : new List<TmdbContentDto>();

            var watchedTvIds = await _db.UserShows
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbShowId)
                .ToListAsync();

            var watchedMovieIds = await _db.UserMovies
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbMovieId)
                .ToListAsync();

            return new RecommendationResponseDto
            {
                Tv = RankWithDiversity(
                    tvCandidates.Where(x => !watchedTvIds.Contains(x.Id)).ToList(),
                    tvProfile,
                    20
                ),
                Movies = RankWithDiversity(
                    movieCandidates.Where(x => !watchedMovieIds.Contains(x.Id)).ToList(),
                    movieProfile,
                    20
                )
            };
        }

        // ---------------- PROFILE BUILDERS ----------------

        private async Task<Dictionary<int, double>> BuildUserGenreProfileTv(Guid userId)
        {
            var shows = await _db.UserShows
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return Normalize(BuildProfile(
                shows,
                s => s.GenresJson,
                s => s.Status,
                s => s.UserRating,
                s => s.LastWatchedAt
            ));
        }

        private async Task<Dictionary<int, double>> BuildUserGenreProfileMovie(Guid userId)
        {
            var movies = await _db.UserMovies
                .Where(x => x.UserId == userId)
                .ToListAsync();

            return Normalize(BuildProfile(
                movies,
                m => m.GenresJson,
                m => m.Status,
                m => m.UserRating,
                m => m.WatchedAt
            ));
        }

        private Dictionary<int, double> BuildProfile<T>(
     IEnumerable<T> items,
     Func<T, string?> genreJson,
     Func<T, WatchStatus> status,
     Func<T, double?> rating,
     Func<T, DateTime?> lastWatched
 )
        {
            var scores = new Dictionary<int, double>();

            foreach (var item in items)
            {
                var json = genreJson(item);
                if (string.IsNullOrWhiteSpace(json))
                    continue;

                var weight =
                    GetStatusWeight(status(item)) *
                    GetRatingWeight(rating(item)) *
                    GetRecencyBoost(lastWatched(item));

                if (weight == 0) continue;

                var genres = GenreProfileHelper.GetGenres(json);
                foreach (var g in genres)
                {
                    scores[g.Id] = scores.GetValueOrDefault(g.Id) + weight;
                }
            }

            return scores;
        }

        // ---------------- SCORING ----------------

        private static IEnumerable<int> GetGenreIds(TmdbContentDto item)
        {
            if (item.GenreIds?.Any() == true)
                return item.GenreIds;

            if (item.Genres?.Any() == true)
                return item.Genres.Select(g => g.Id);

            return Enumerable.Empty<int>();
        }

        private double BaseScore(TmdbContentDto item, Dictionary<int, double> profile)
        {
            return GetGenreIds(item)
                .Sum(id => profile.TryGetValue(id, out var score) ? score : 0);
        }

        private List<TmdbContentDto> RankWithDiversity(
            List<TmdbContentDto> items,
            Dictionary<int, double> profile,
            int limit)
        {
            var result = new List<TmdbContentDto>();
            var genreCounts = new Dictionary<int, int>();

            var ranked = items
                .Select(i => new { Item = i, Score = BaseScore(i, profile) })
                .OrderByDescending(x => x.Score)
                .ToList();

            foreach (var entry in ranked)
            {
                if (result.Count >= limit)
                    break;

                if (entry.Score < -0.3)
                    continue;

                double penalty = 1.0;
                foreach (var gid in GetGenreIds(entry.Item))
                {
                    if (genreCounts.TryGetValue(gid, out var count))
                        penalty *= 1.0 / (1 + count * 0.5);
                }

                if (entry.Score * penalty <= 0)
                    continue;

                result.Add(entry.Item);

                foreach (var gid in GetGenreIds(entry.Item))
                {
                    genreCounts[gid] = genreCounts.GetValueOrDefault(gid) + 1;
                }
            }

            return result;
        }

        // ---------------- HELPERS ----------------

        private static Dictionary<int, double> Normalize(Dictionary<int, double> scores)
        {
            var max = scores.Values.Where(v => v > 0).DefaultIfEmpty(1).Max();
            return scores.ToDictionary(kv => kv.Key, kv => kv.Value / max);
        }

        private static double GetStatusWeight(WatchStatus status) => status switch
        {
            WatchStatus.Completed => 1.5,
            WatchStatus.Watching => 1.2,
            WatchStatus.PlanToWatch => 0.2,
            WatchStatus.OnHold => 0.3,
            WatchStatus.Dropped => -0.5,
            _ => 0
        };

        private static double GetRatingWeight(double? rating)
            => rating.HasValue ? 0.5 + rating.Value / 10 : 1.0;

        private static double GetRecencyBoost(DateTime? lastWatched)
        {
            if (!lastWatched.HasValue) return 1.0;

            var days = (DateTime.UtcNow - lastWatched.Value).TotalDays;
            if (days <= 7) return 1.4;
            if (days <= 30) return 1.2;
            return 1.0;
        }
    }
}