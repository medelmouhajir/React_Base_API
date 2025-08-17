using System.Linq.Expressions;
using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Businesses;
using React_Virtuello.Server.DTOs.Events;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;

namespace React_Virtuello.Server.Controllers.Map
{
    [ApiController]
    [Route("api/[controller]")]
    public class MapController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<MapController> _logger;

        public MapController(
            IUnitOfWork unitOfWork,
            ILogger<MapController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        // =============================================================================
        // BUSINESSES IN BOUNDS
        // =============================================================================

        /// <summary>
        /// Get businesses within specified geographic bounds
        /// </summary>
        /// <param name="north">North latitude boundary</param>
        /// <param name="south">South latitude boundary</param>
        /// <param name="east">East longitude boundary</param>
        /// <param name="west">West longitude boundary</param>
        /// <param name="tags">Optional tag IDs to filter by</param>
        /// <param name="search">Optional search query</param>
        /// <param name="status">Optional business status filter</param>
        /// <returns>List of businesses within bounds</returns>
        [HttpGet("businesses/bounds")]
        public async Task<ActionResult<ApiResponse<IEnumerable<BusinessDto>>>> GetBusinessesInBounds(
            [FromQuery] double north,
            [FromQuery] double south,
            [FromQuery] double east,
            [FromQuery] double west,
            [FromQuery] List<Guid>? tags = null,
            [FromQuery] string? search = null,
            [FromQuery] BusinessStatus? status = null)
        {
            try
            {
                _logger.LogInformation("Getting businesses in bounds: N:{North}, S:{South}, E:{East}, W:{West}",
                    north, south, east, west);

                // Validate bounds
                if (north <= south || east <= west)
                {
                    return BadRequest(new ApiResponse<IEnumerable<BusinessDto>>
                    {
                        Success = false,
                        Message = "Invalid geographic bounds provided"
                    });
                }

                // Create bounds filter expression
                Expression<Func<Business, bool>> boundsFilter = b =>
                    b.Latitude >= south && b.Latitude <= north &&
                    b.Longitude >= west && b.Longitude <= east;

                var businesses = await _unitOfWork.Businesses.FindAsync(boundsFilter);

                // Apply additional filters in memory (or extend repository for complex filters)
                var filteredBusinesses = businesses.AsEnumerable();

                if (status.HasValue)
                {
                    filteredBusinesses = filteredBusinesses.Where(b => b.Status == status.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    filteredBusinesses = filteredBusinesses.Where(b =>
                        b.Name.ToLower().Contains(searchLower) ||
                        (b.Description != null && b.Description.ToLower().Contains(searchLower)) ||
                        (b.Address != null && b.Address.ToLower().Contains(searchLower)));
                }

                if (tags != null && tags.Any())
                {
                    // Filter by tags - assuming Business has a Tags navigation property
                    filteredBusinesses = filteredBusinesses.Where(b =>
                        b.Tags != null && b.Tags.Any(bt => tags.Contains(bt.TagId)));
                }

                var businessesList = filteredBusinesses.Take(1000).ToList(); // Limit to prevent performance issues

                var businessDtos = businessesList.Select(MapBusinessToDto).ToList();

                _logger.LogInformation("Found {Count} businesses in bounds", businessDtos.Count);

                return Ok(new ApiResponse<IEnumerable<BusinessDto>>
                {
                    Success = true,
                    Data = businessDtos,
                    Message = $"Found {businessDtos.Count} businesses"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting businesses in bounds");
                return StatusCode(500, new ApiResponse<IEnumerable<BusinessDto>>
                {
                    Success = false,
                    Message = "An error occurred while fetching businesses"
                });
            }
        }

        // =============================================================================
        // EVENTS IN BOUNDS
        // =============================================================================

        /// <summary>
        /// Get events within specified geographic bounds
        /// </summary>
        /// <param name="north">North latitude boundary</param>
        /// <param name="south">South latitude boundary</param>
        /// <param name="east">East longitude boundary</param>
        /// <param name="west">West longitude boundary</param>
        /// <param name="categories">Optional category IDs to filter by</param>
        /// <param name="search">Optional search query</param>
        /// <param name="status">Optional event status filter</param>
        /// <param name="type">Optional event type filter</param>
        /// <param name="startDate">Optional start date filter</param>
        /// <param name="endDate">Optional end date filter</param>
        /// <returns>List of events within bounds</returns>
        [HttpGet("events/bounds")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventDto>>>> GetEventsInBounds(
            [FromQuery] double north,
            [FromQuery] double south,
            [FromQuery] double east,
            [FromQuery] double west,
            [FromQuery] List<Guid>? categories = null,
            [FromQuery] string? search = null,
            [FromQuery] EventStatus? status = null,
            [FromQuery] EventType? type = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation("Getting events in bounds: N:{North}, S:{South}, E:{East}, W:{West}",
                    north, south, east, west);

                // Validate bounds
                if (north <= south || east <= west)
                {
                    return BadRequest(new ApiResponse<IEnumerable<EventDto>>
                    {
                        Success = false,
                        Message = "Invalid geographic bounds provided"
                    });
                }

                // Create bounds filter expression
                Expression<Func<Event, bool>> boundsFilter = e =>
                    e.Latitude >= south && e.Latitude <= north &&
                    e.Longitude >= west && e.Longitude <= east;

                var events = await _unitOfWork.Events.FindAsync(boundsFilter);

                // Apply additional filters in memory
                var filteredEvents = events.AsEnumerable();

                if (status.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Status == status.Value);
                }

                if (type.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Type == type.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    filteredEvents = filteredEvents.Where(e =>
                        e.Name.ToLower().Contains(searchLower) ||
                        (e.Description != null && e.Description.ToLower().Contains(searchLower)) ||
                        (e.Address != null && e.Address.ToLower().Contains(searchLower)));
                }

                if (categories != null && categories.Any())
                {
                    filteredEvents = filteredEvents.Where(e => categories.Contains(e.EventCategoryId));
                }

                if (startDate.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Start >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.End <= endDate.Value || (e.End == null && e.Start <= endDate.Value));
                }

                var eventsList = filteredEvents.Take(1000).ToList(); // Limit to prevent performance issues

                var eventDtos = eventsList.Select(MapEventToDto).ToList();

                _logger.LogInformation("Found {Count} events in bounds", eventDtos.Count);

                return Ok(new ApiResponse<IEnumerable<EventDto>>
                {
                    Success = true,
                    Data = eventDtos,
                    Message = $"Found {eventDtos.Count} events"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting events in bounds");
                return StatusCode(500, new ApiResponse<IEnumerable<EventDto>>
                {
                    Success = false,
                    Message = "An error occurred while fetching events"
                });
            }
        }

        // =============================================================================
        // BUSINESSES NEAR LOCATION
        // =============================================================================

        /// <summary>
        /// Get businesses near a specific location
        /// </summary>
        /// <param name="latitude">Center latitude</param>
        /// <param name="longitude">Center longitude</param>
        /// <param name="radiusKm">Search radius in kilometers</param>
        /// <param name="limit">Maximum number of results</param>
        /// <param name="tags">Optional tag IDs to filter by</param>
        /// <param name="search">Optional search query</param>
        /// <param name="status">Optional business status filter</param>
        /// <returns>List of businesses near location with distances</returns>
        [HttpGet("businesses/near")]
        public async Task<ActionResult<ApiResponse<IEnumerable<BusinessWithDistanceDto>>>> GetBusinessesNearLocation(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double radiusKm = 10,
            [FromQuery] int limit = 50,
            [FromQuery] List<Guid>? tags = null,
            [FromQuery] string? search = null,
            [FromQuery] BusinessStatus? status = null)
        {
            try
            {
                _logger.LogInformation("Getting businesses near location: {Lat}, {Lng} within {Radius}km",
                    latitude, longitude, radiusKm);

                // Validate coordinates
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
                {
                    return BadRequest(new ApiResponse<IEnumerable<BusinessWithDistanceDto>>
                    {
                        Success = false,
                        Message = "Invalid coordinates provided"
                    });
                }

                // Use existing repository method for location-based search
                var businesses = await _unitOfWork.Businesses.GetByLocationAsync(latitude, longitude, radiusKm);

                // Apply additional filters in memory
                var filteredBusinesses = businesses.AsEnumerable();

                if (status.HasValue)
                {
                    filteredBusinesses = filteredBusinesses.Where(b => b.Status == status.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    filteredBusinesses = filteredBusinesses.Where(b =>
                        b.Name.ToLower().Contains(searchLower) ||
                        (b.Description != null && b.Description.ToLower().Contains(searchLower)) ||
                        (b.Address != null && b.Address.ToLower().Contains(searchLower)));
                }

                if (tags != null && tags.Any())
                {
                    filteredBusinesses = filteredBusinesses.Where(b =>
                        b.Tags != null && b.Tags.Any(bt => tags.Contains(bt.TagId)));
                }

                // Calculate distances and sort by distance (repository already does distance filtering)
                var businessesWithDistance = filteredBusinesses
                    .Select(b => new BusinessWithDistanceDto
                    {
                        Business = MapBusinessToDto(b),
                        DistanceKm = Math.Round(CalculateDistance(latitude, longitude, b.Latitude, b.Longitude), 2)
                    })
                    .OrderBy(x => x.DistanceKm)
                    .Take(limit)
                    .ToList();

                _logger.LogInformation("Found {Count} businesses near location", businessesWithDistance.Count);

                return Ok(new ApiResponse<IEnumerable<BusinessWithDistanceDto>>
                {
                    Success = true,
                    Data = businessesWithDistance,
                    Message = $"Found {businessesWithDistance.Count} businesses within {radiusKm}km"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting businesses near location");
                return StatusCode(500, new ApiResponse<IEnumerable<BusinessWithDistanceDto>>
                {
                    Success = false,
                    Message = "An error occurred while fetching nearby businesses"
                });
            }
        }

        // =============================================================================
        // EVENTS NEAR LOCATION
        // =============================================================================

        /// <summary>
        /// Get events near a specific location
        /// </summary>
        /// <param name="latitude">Center latitude</param>
        /// <param name="longitude">Center longitude</param>
        /// <param name="radiusKm">Search radius in kilometers</param>
        /// <param name="limit">Maximum number of results</param>
        /// <param name="categories">Optional category IDs to filter by</param>
        /// <param name="search">Optional search query</param>
        /// <param name="status">Optional event status filter</param>
        /// <param name="type">Optional event type filter</param>
        /// <param name="startDate">Optional start date filter</param>
        /// <param name="endDate">Optional end date filter</param>
        /// <returns>List of events near location with distances</returns>
        [HttpGet("events/near")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventWithDistanceDto>>>> GetEventsNearLocation(
            [FromQuery] double latitude,
            [FromQuery] double longitude,
            [FromQuery] double radiusKm = 10,
            [FromQuery] int limit = 50,
            [FromQuery] List<Guid>? categories = null,
            [FromQuery] string? search = null,
            [FromQuery] EventStatus? status = null,
            [FromQuery] EventType? type = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                _logger.LogInformation("Getting events near location: {Lat}, {Lng} within {Radius}km",
                    latitude, longitude, radiusKm);

                // Validate coordinates
                if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)
                {
                    return BadRequest(new ApiResponse<IEnumerable<EventWithDistanceDto>>
                    {
                        Success = false,
                        Message = "Invalid coordinates provided"
                    });
                }

                // Create bounds from center point and radius for initial filtering
                var latDelta = radiusKm / 111.0; // Rough conversion: 1 degree ≈ 111 km
                var lonDelta = radiusKm / (111.0 * Math.Cos(latitude * Math.PI / 180.0));

                Expression<Func<Event, bool>> boundsFilter = e =>
                    e.Latitude >= latitude - latDelta && e.Latitude <= latitude + latDelta &&
                    e.Longitude >= longitude - lonDelta && e.Longitude <= longitude + lonDelta;

                var events = await _unitOfWork.Events.FindAsync(boundsFilter);

                // Apply additional filters and calculate exact distances
                var filteredEvents = events.AsEnumerable();

                if (status.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Status == status.Value);
                }

                if (type.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Type == type.Value);
                }

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var searchLower = search.ToLower();
                    filteredEvents = filteredEvents.Where(e =>
                        e.Name.ToLower().Contains(searchLower) ||
                        (e.Description != null && e.Description.ToLower().Contains(searchLower)) ||
                        (e.Address != null && e.Address.ToLower().Contains(searchLower)));
                }

                if (categories != null && categories.Any())
                {
                    filteredEvents = filteredEvents.Where(e => categories.Contains(e.EventCategoryId));
                }

                if (startDate.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.Start >= startDate.Value);
                }

                if (endDate.HasValue)
                {
                    filteredEvents = filteredEvents.Where(e => e.End <= endDate.Value || (e.End == null && e.Start <= endDate.Value));
                }

                // Calculate distances and filter by exact radius
                var eventsWithDistance = filteredEvents
                    .Select(e => new
                    {
                        Event = e,
                        Distance = CalculateDistance(latitude, longitude, e.Latitude, e.Longitude)
                    })
                    .Where(x => x.Distance <= radiusKm)
                    .OrderBy(x => x.Distance)
                    .Take(limit)
                    .Select(x => new EventWithDistanceDto
                    {
                        Event = MapEventToDto(x.Event),
                        DistanceKm = Math.Round(x.Distance, 2)
                    })
                    .ToList();

                _logger.LogInformation("Found {Count} events near location", eventsWithDistance.Count);

                return Ok(new ApiResponse<IEnumerable<EventWithDistanceDto>>
                {
                    Success = true,
                    Data = eventsWithDistance,
                    Message = $"Found {eventsWithDistance.Count} events within {radiusKm}km"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting events near location");
                return StatusCode(500, new ApiResponse<IEnumerable<EventWithDistanceDto>>
                {
                    Success = false,
                    Message = "An error occurred while fetching nearby events"
                });
            }
        }

        // =============================================================================
        // UTILITY METHODS
        // =============================================================================

        /// <summary>
        /// Calculate distance between two coordinates using Haversine formula
        /// </summary>
        /// <param name="lat1">First point latitude</param>
        /// <param name="lon1">First point longitude</param>
        /// <param name="lat2">Second point latitude</param>
        /// <param name="lon2">Second point longitude</param>
        /// <returns>Distance in kilometers</returns>
        private static double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
        {
            const double R = 6371; // Earth's radius in kilometers
            var dLat = ToRadians(lat2 - lat1);
            var dLon = ToRadians(lon2 - lon1);
            var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                    Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
                    Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
            var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
            return R * c;
        }

        /// <summary>
        /// Convert degrees to radians
        /// </summary>
        /// <param name="degrees">Degrees to convert</param>
        /// <returns>Radians</returns>
        private static double ToRadians(double degrees)
        {
            return degrees * (Math.PI / 180);
        }

        // =============================================================================
        // MAPPING METHODS
        // =============================================================================

        private static BusinessDto MapBusinessToDto(Business business) => new()
        {
            Id = business.Id,
            Name = business.Name,
            Description = business.Description,
            Status = business.Status,
            Phone = business.Phone,
            Email = business.Email,
            ImagePath = business.ImagePath,
            LogoPath = business.LogoPath,
            WhatsApp = business.WhatsApp,
            Instagram = business.Instagram,
            Facebook = business.Facebook,
            Website = business.Website,
            OwnerId = business.OwnerId,
            Latitude = business.Latitude,
            Longitude = business.Longitude,
            Address = business.Address,
            AverageRating = business.AverageRating,
            CommentCount = business.CommentCount,
            CreatedAt = business.CreatedAt,
            UpdatedAt = business.UpdatedAt
        };

        private static EventDto MapEventToDto(Event eventEntity) => new()
        {
            Id = eventEntity.Id,
            Name = eventEntity.Name,
            Description = eventEntity.Description,
            Picture = eventEntity.Picture,
            Start = eventEntity.Start,
            End = eventEntity.End,
            Status = eventEntity.Status,
            Type = eventEntity.Type,
            OrganizerId = eventEntity.OrganizerId,
            EventCategoryId = eventEntity.EventCategoryId,
            Latitude = eventEntity.Latitude,
            Longitude = eventEntity.Longitude,
            Address = eventEntity.Address
        };
    }

    // =============================================================================
    // DTOS FOR DISTANCE RESULTS
    // =============================================================================

    /// <summary>
    /// Business with calculated distance
    /// </summary>
    public class BusinessWithDistanceDto
    {
        public BusinessDto Business { get; set; } = new();
        public double DistanceKm { get; set; }
    }

    /// <summary>
    /// Event with calculated distance
    /// </summary>
    public class EventWithDistanceDto
    {
        public EventDto Event { get; set; } = new();
        public double DistanceKm { get; set; }
    }
}