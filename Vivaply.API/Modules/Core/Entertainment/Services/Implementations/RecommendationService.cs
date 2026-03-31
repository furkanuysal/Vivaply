using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class RecommendationService(VivaplyDbContext db, ITmdbService tmdb) : IRecommendationService
    {
        private readonly VivaplyDbContext _db = db;
        private readonly ITmdbService _tmdb = tmdb;

        public async Task<RecommendationResponseDto> GetRecommendationsAsync(Guid userId, string language = "en-US")
        {
            var tvProfile = await BuildUserGenreProfileTv(userId);
            var movieProfile = await BuildUserGenreProfileMovie(userId);

            var topTvGenres = tvProfile
                .OrderByDescending(x => x.Value)
                .Take(5)
                .Select(x => x.Key)
                .ToArray();

            var topMovieGenres = movieProfile
                .OrderByDescending(x => x.Value)
                .Take(5)
                .Select(x => x.Key)
                .ToArray();

            var tvCandidates = topTvGenres.Any()
                ? await _tmdb.DiscoverTvAsync(string.Join(",", topTvGenres), language)
                : [];

            var movieCandidates = topMovieGenres.Any()
                ? await _tmdb.DiscoverMoviesAsync(string.Join(",", topMovieGenres), language)
                : [];

            var watchedTvIds = await _db.UserShows
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbShowId)
                .ToHashSetAsync();

            var watchedMovieIds = await _db.UserMovies
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => x.TmdbMovieId)
                .ToHashSetAsync();

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
            var items = await _db.UserShows
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new ProfileItem(
                    x.Metadata!.GenresJson,
                    x.Status,
                    x.UserRating,
                    x.LastWatchedAt
                ))
                .ToListAsync();

            return Normalize(BuildProfile(
                items,
                i => i.GenresJson,
                i => i.Status,
                i => i.Rating,
                i => i.LastWatched
            ));
        }

        private async Task<Dictionary<int, double>> BuildUserGenreProfileMovie(Guid userId)
        {
            var items = await _db.UserMovies
                .AsNoTracking()
                .Where(x => x.UserId == userId)
                .Select(x => new ProfileItem(
                    x.Metadata!.GenresJson,
                    x.Status,
                    x.UserRating,
                    x.WatchedAt
                ))
                .ToListAsync();

            return Normalize(BuildProfile(
                items,
                i => i.GenresJson,
                i => i.Status,
                i => i.Rating,
                i => i.LastWatched
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

                var genres = JsonHelper.DeserializeList<TmdbGenreDto>(json) ?? [];
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
                .Select(i => (Item: i, Score: BaseScore(i, profile)))
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

        private sealed record ProfileItem(
            string? GenresJson,
            WatchStatus Status,
            double? Rating,
            DateTime? LastWatched
            );
    }
}