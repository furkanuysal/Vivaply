using Microsoft.Extensions.Caching.Memory;
using System.Globalization;
using Vivaply.API.DTOs.Location;

namespace Vivaply.API.Services.Location
{
    public sealed class NominatimService : INominatimService
    {
        private readonly HttpClient _http;
        private readonly IMemoryCache _cache;

        public NominatimService(HttpClient http, IMemoryCache cache)
        {
            _http = http;
            _cache = cache;
        }

        public async Task<IReadOnlyList<LocationResultDto>> SearchAsync(string query,
        CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Length < 3)
                return Array.Empty<LocationResultDto>();

            var cacheKey = CacheKey(query);

            // Cache hit
            if (_cache.TryGetValue(cacheKey, out IReadOnlyList<LocationResultDto>? cached) && cached is not null)
            {
                return cached;
            }

            // Cache miss → Nominatim
            var url =
                $"search?format=json&q={Uri.EscapeDataString(query)}" +
                "&limit=5&addressdetails=0";

            var data = await _http.GetFromJsonAsync<List<NominatimRawDto>>(url, ct);

            var results = data?
                .Select(x => new LocationResultDto
                {
                    DisplayName = x.display_name,
                    Lat = double.Parse(x.lat, CultureInfo.InvariantCulture),
                    Lon = double.Parse(x.lon, CultureInfo.InvariantCulture),
                })
                .ToArray()
                ?? Array.Empty<LocationResultDto>();

            // Store in cache
            _cache.Set(
                cacheKey,
                results,
                TimeSpan.FromMinutes(10)
            );

            return results;
        }


        private sealed class NominatimRawDto
        {
            public string display_name { get; set; } = default!;
            public string lat { get; set; } = default!;
            public string lon { get; set; } = default!;
        }

        private static string CacheKey(string query) => $"location-search:{query.ToLowerInvariant()}";

    }
}
