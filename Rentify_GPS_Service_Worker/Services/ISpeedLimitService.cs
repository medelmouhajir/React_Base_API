using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Rentify_GPS_Service_Worker.Services
{
    /// <summary>
    /// Service to fetch speed limits from OpenStreetMap using Overpass API
    /// </summary>
    public interface ISpeedLimitService
    {
        Task<int?> GetSpeedLimitAsync(double latitude, double longitude, CancellationToken cancellationToken = default);
    }

    public class OpenStreetMapSpeedLimitService : ISpeedLimitService
    {
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private readonly ILogger<OpenStreetMapSpeedLimitService> _logger;
        private const string OVERPASS_API_URL = "https://overpass-api.de/api/interpreter";
        private const int CACHE_DURATION_HOURS = 24; // Cache speed limits for 24 hours
        private const int SEARCH_RADIUS_METERS = 25; // Search within 25 meters of the coordinate

        public OpenStreetMapSpeedLimitService(
            HttpClient httpClient,
            IMemoryCache cache,
            ILogger<OpenStreetMapSpeedLimitService> logger)
        {
            _httpClient = httpClient;
            _cache = cache;
            _logger = logger;

            // Set timeout for API calls
            _httpClient.Timeout = TimeSpan.FromSeconds(10);
        }

        public async Task<int?> GetSpeedLimitAsync(double latitude, double longitude, CancellationToken cancellationToken = default)
        {
            try
            {
                // Generate cache key based on rounded coordinates (to ~11m precision)
                var cacheKey = GenerateCacheKey(latitude, longitude);

                // Check cache first
                if (_cache.TryGetValue<int?>(cacheKey, out var cachedSpeedLimit))
                {
                    _logger.LogDebug("Speed limit found in cache for ({Lat},{Lon}): {SpeedLimit} km/h",
                        latitude, longitude, cachedSpeedLimit);
                    return cachedSpeedLimit;
                }

                // Build Overpass QL query
                var query = BuildOverpassQuery(latitude, longitude);

                // Make API request
                var content = new StringContent(query);
                var response = await _httpClient.PostAsync(OVERPASS_API_URL, content, cancellationToken);

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Overpass API returned status {StatusCode}", response.StatusCode);
                    return null;
                }

                var jsonResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                var speedLimit = ParseSpeedLimit(jsonResponse);

                // Cache the result (even if null, to avoid repeated failed lookups)
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromHours(CACHE_DURATION_HOURS));

                _cache.Set(cacheKey, speedLimit, cacheOptions);

                if (speedLimit.HasValue)
                {
                    _logger.LogInformation("Speed limit fetched for ({Lat},{Lon}): {SpeedLimit} km/h",
                        latitude, longitude, speedLimit.Value);
                }
                else
                {
                    _logger.LogDebug("No speed limit found for ({Lat},{Lon})", latitude, longitude);
                }

                return speedLimit;
            }
            catch (TaskCanceledException)
            {
                _logger.LogWarning("Speed limit API request timed out for ({Lat},{Lon})", latitude, longitude);
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching speed limit for ({Lat},{Lon})", latitude, longitude);
                return null;
            }
        }

        private string BuildOverpassQuery(double latitude, double longitude)
        {
            // Query for roads within radius that have a maxspeed tag
            return $@"[out:json][timeout:5];
(
  way(around:{SEARCH_RADIUS_METERS},{latitude},{longitude})[""highway""][""maxspeed""];
);
out tags;";
        }

        private int? ParseSpeedLimit(string jsonResponse)
        {
            try
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };

                var overpassResponse = JsonSerializer.Deserialize<OverpassResponse>(jsonResponse, options);

                if (overpassResponse?.Elements == null || overpassResponse.Elements.Length == 0)
                {
                    return null;
                }

                // Find the first element with a maxspeed tag
                foreach (var element in overpassResponse.Elements)
                {
                    if (element.Tags?.TryGetValue("maxspeed", out var maxSpeedStr) == true)
                    {
                        return ParseMaxSpeedTag(maxSpeedStr);
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing Overpass API response");
                return null;
            }
        }

        private int? ParseMaxSpeedTag(string maxSpeedStr)
        {
            if (string.IsNullOrWhiteSpace(maxSpeedStr))
                return null;

            // Handle common formats:
            // "50" -> 50 km/h
            // "50 km/h" -> 50 km/h
            // "30 mph" -> convert to km/h
            // "walk" -> 5 km/h
            // "none" -> null (no limit)

            maxSpeedStr = maxSpeedStr.Trim().ToLower();

            if (maxSpeedStr == "none" || maxSpeedStr == "signals" || maxSpeedStr == "variable")
                return null;

            if (maxSpeedStr == "walk")
                return 5;

            // Try to extract numeric value
            var numericPart = new string(maxSpeedStr.TakeWhile(c => char.IsDigit(c)).ToArray());

            if (!int.TryParse(numericPart, out var speed))
                return null;

            // Convert mph to km/h if needed
            if (maxSpeedStr.Contains("mph"))
            {
                speed = (int)Math.Round(speed * 1.60934);
            }

            return speed;
        }

        private string GenerateCacheKey(double latitude, double longitude)
        {
            // Round to 4 decimal places (~11m precision) for cache key
            var latRounded = Math.Round(latitude, 4);
            var lonRounded = Math.Round(longitude, 4);
            return $"speedlimit_{latRounded}_{lonRounded}";
        }
    }

    #region Overpass API Response Models

    internal class OverpassResponse
    {
        [JsonPropertyName("elements")]
        public OverpassElement[]? Elements { get; set; }
    }

    internal class OverpassElement
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("tags")]
        public Dictionary<string, string>? Tags { get; set; }
    }

    #endregion
}
