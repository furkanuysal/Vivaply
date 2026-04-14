using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;
using Vivaply.API.Data;
using Vivaply.API.Infrastructure.Serialization;
using Vivaply.API.Modules.Core.Entertainment.DTOs.External.Tmdb;
using Vivaply.API.Modules.Core.Entertainment.DTOs.Results;
using Vivaply.API.Modules.Core.Entertainment.Enums;
using Vivaply.API.Modules.Core.Entertainment.Services.Interfaces;

namespace Vivaply.API.Modules.Core.Entertainment.Services.Implementations
{
    public class RecommendationService(VivaplyDbContext db, IMemoryCache cache, ITmdbService tmdb) : IRecommendationService
    {
        private static readonly TimeSpan RecommendationCacheDuration = TimeSpan.FromMinutes(15);
        private static readonly TimeSpan RecommendationCacheSlidingDuration = TimeSpan.FromMinutes(5);
        private readonly VivaplyDbContext _db = db;
        private readonly IMemoryCache _cache = cache;
        private readonly ITmdbService _tmdb = tmdb;

        public async Task<RecommendationResponseDto> GetRecommendationsAsync(Guid userId, string language = "en-US")
        {
            var cacheKey = $"entertainment:recommendations:{userId}:{language}".ToLowerInvariant();
            if (_cache.TryGetValue(cacheKey, out RecommendationResponseDto? cached) && cached is not null)
            {
                return cached;
            }

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

            var tvCandidates = await BuildCandidatePoolAsync(
                topTvGenres,
                watchedTvIds,
                language,
                _tmdb.DiscoverTvAsync,
                _tmdb.GetTrendingTvShowsAsync);

            var movieCandidates = await BuildCandidatePoolAsync(
                topMovieGenres,
                watchedMovieIds,
                language,
                _tmdb.DiscoverMoviesAsync,
                _tmdb.GetTrendingMoviesAsync);

            var response = new RecommendationResponseDto
            {
                Tv = RankRecommendations(tvCandidates, tvProfile, 20),
                Movies = RankRecommendations(movieCandidates, movieProfile, 20)
            };

            _cache.Set(
                cacheKey,
                response,
                new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = RecommendationCacheDuration,
                    SlidingExpiration = RecommendationCacheSlidingDuration
                });

            return response;
        }

        private async Task<List<TmdbContentDto>> BuildCandidatePoolAsync(
            IReadOnlyCollection<int> topGenres,
            HashSet<int> watchedIds,
            string language,
            Func<string, string, Task<List<TmdbContentDto>>> discoverFunc,
            Func<string, Task<List<TmdbContentDto>>> trendingFunc)
        {
            var candidateMap = new Dictionary<int, TmdbContentDto>();

            void AddRange(IEnumerable<TmdbContentDto> items)
            {
                foreach (var item in items)
                {
                    if (!watchedIds.Contains(item.Id))
                    {
                        candidateMap[item.Id] = item;
                    }
                }
            }

            foreach (var query in BuildDiscoverQueries(topGenres))
            {
                var results = await discoverFunc(query, language);
                AddRange(results);
            }

            var trending = await trendingFunc(language);
            AddRange(trending);

            return candidateMap.Values.ToList();
        }

        private static IEnumerable<string> BuildDiscoverQueries(IReadOnlyCollection<int> topGenres)
        {
            var genres = topGenres.Take(4).ToArray();
            if (genres.Length == 0)
            {
                return [];
            }

            var queries = new List<string>();
            queries.AddRange(genres.Select(id => id.ToString()));

            if (genres.Length >= 2)
            {
                queries.Add(string.Join(",", genres.Take(2)));
            }

            if (genres.Length >= 3)
            {
                queries.Add(string.Join(",", genres.Take(3)));
            }

            return queries.Distinct();
        }

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

                if (weight == 0)
                    continue;

                var genres = JsonHelper.DeserializeList<TmdbGenreDto>(json) ?? [];
                foreach (var genre in genres)
                {
                    scores[genre.Id] = scores.GetValueOrDefault(genre.Id) + weight;
                }
            }

            return scores;
        }

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

        private List<TmdbContentDto> RankRecommendations(
            List<TmdbContentDto> items,
            Dictionary<int, double> profile,
            int limit)
        {
            var result = new List<TmdbContentDto>();
            var genreCounts = new Dictionary<int, int>();

            var ranked = items
                .Select(item => (Item: item, Score: RecommendationScore(item, profile)))
                .OrderByDescending(x => x.Score)
                .ToList();

            foreach (var entry in ranked)
            {
                if (result.Count >= limit)
                    break;

                if (entry.Score <= 0.12)
                    continue;

                var diversityPenalty = GetDiversityPenalty(entry.Item, genreCounts);
                var finalScore = entry.Score * diversityPenalty;
                if (finalScore <= 0.08)
                    continue;

                result.Add(entry.Item);

                foreach (var genreId in GetGenreIds(entry.Item))
                {
                    genreCounts[genreId] = genreCounts.GetValueOrDefault(genreId) + 1;
                }
            }

            return result;
        }

        private double RecommendationScore(TmdbContentDto item, Dictionary<int, double> profile)
        {
            var profileScore = profile.Count == 0
                ? 0.35
                : Math.Min(BaseScore(item, profile) / 2.5, 1.6);

            var qualityScore = NormalizeRange(item.VoteAverage, 5.5, 8.8) * 0.9;
            var voteConfidence = NormalizeRange(Math.Log10(item.VoteCount + 1), 0.5, 3.2) * 0.35;
            var popularityScore = NormalizeRange(Math.Log10(item.Popularity + 1), 0.6, 2.7) * 0.35;
            var freshnessScore = GetFreshnessScore(item) * 0.2;
            var completenessPenalty = string.IsNullOrWhiteSpace(item.PosterPath) ? -0.1 : 0;
            var weakRatingPenalty = item.VoteAverage > 0 && item.VoteAverage < 6 ? -0.25 : 0;

            return profileScore +
                   qualityScore +
                   voteConfidence +
                   popularityScore +
                   freshnessScore +
                   completenessPenalty +
                   weakRatingPenalty;
        }

        private static double GetDiversityPenalty(
            TmdbContentDto item,
            Dictionary<int, int> genreCounts)
        {
            var penalty = 1.0;

            foreach (var genreId in GetGenreIds(item))
            {
                if (genreCounts.TryGetValue(genreId, out var count))
                {
                    penalty *= 1.0 / (1 + count * 0.35);
                }
            }

            return penalty;
        }

        private static Dictionary<int, double> Normalize(Dictionary<int, double> scores)
        {
            var max = scores.Values.Where(v => v > 0).DefaultIfEmpty(1).Max();
            return scores.ToDictionary(kv => kv.Key, kv => kv.Value / max);
        }

        private static double NormalizeRange(double value, double min, double max)
        {
            if (max <= min)
                return 0;

            var normalized = (value - min) / (max - min);
            return Math.Clamp(normalized, 0, 1);
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
            if (!lastWatched.HasValue)
                return 1.0;

            var days = (DateTime.UtcNow - lastWatched.Value).TotalDays;
            if (days <= 7) return 1.4;
            if (days <= 30) return 1.2;
            return 1.0;
        }

        private static double GetFreshnessScore(TmdbContentDto item)
        {
            var dateValue = !string.IsNullOrWhiteSpace(item.ReleaseDate)
                ? item.ReleaseDate
                : item.FirstAirDate;

            if (string.IsNullOrWhiteSpace(dateValue) || !DateTime.TryParse(dateValue, out var parsed))
                return 0.05;

            var ageInDays = (DateTime.UtcNow.Date - parsed.Date).TotalDays;
            if (ageInDays <= 120) return 0.25;
            if (ageInDays <= 365 * 2) return 0.18;
            if (ageInDays <= 365 * 5) return 0.1;
            return 0.03;
        }

        private sealed record ProfileItem(
            string? GenresJson,
            WatchStatus Status,
            double? Rating,
            DateTime? LastWatched
            );
    }
}
