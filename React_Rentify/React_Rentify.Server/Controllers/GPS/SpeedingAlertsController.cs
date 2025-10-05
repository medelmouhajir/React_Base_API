using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.GPS.Alerts;

namespace React_Rentify.Server.Controllers.GPS
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SpeedingAlertsController : ControllerBase
    {
        private readonly GpsDbContext _context;
        private readonly ILogger<SpeedingAlertsController> _logger;

        public SpeedingAlertsController(GpsDbContext context, ILogger<SpeedingAlertsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/SpeedingAlerts
        /// Get all speeding alerts with optional filtering
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetSpeedingAlerts(
            [FromQuery] string? deviceSerialNumber = null,
            [FromQuery] SpeedingSeverity? severity = null,
            [FromQuery] bool? isAcknowledged = null,
            [FromQuery] DateTime? fromDate = null,
            [FromQuery] DateTime? toDate = null,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 50)
        {
            try
            {
                var query = _context.Speeding_Alerts
                    .Include(a => a.Gps_Device)
                    .AsQueryable();

                // Apply filters
                if (!string.IsNullOrEmpty(deviceSerialNumber))
                    query = query.Where(a => a.DeviceSerialNumber == deviceSerialNumber);

                if (severity.HasValue)
                    query = query.Where(a => a.Severity == severity.Value);

                if (isAcknowledged.HasValue)
                    query = query.Where(a => a.IsAcknowledged == isAcknowledged.Value);

                if (fromDate.HasValue)
                    query = query.Where(a => a.Timestamp >= fromDate.Value);

                if (toDate.HasValue)
                    query = query.Where(a => a.Timestamp <= toDate.Value);

                // Get total count
                var totalCount = await query.CountAsync();

                // Apply pagination
                var alerts = await query
                    .OrderByDescending(a => a.Timestamp)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(a => new SpeedingAlertDto
                    {
                        Id = a.Id,
                        DeviceSerialNumber = a.DeviceSerialNumber,
                        InstallCarPlate = a.Gps_Device != null ? a.Gps_Device.InstallCarPlate : "Unknown",
                        Timestamp = a.Timestamp,
                        Latitude = a.Latitude,
                        Longitude = a.Longitude,
                        ActualSpeedKmh = a.ActualSpeedKmh,
                        SpeedLimitKmh = a.SpeedLimitKmh,
                        ExceededByKmh = a.ExceededByKmh,
                        ExceededByPercentage = a.ExceededByPercentage,
                        Severity = a.Severity.ToString(),
                        IsAcknowledged = a.IsAcknowledged,
                        AcknowledgedAt = a.AcknowledgedAt,
                        AcknowledgedBy = a.AcknowledgedBy,
                        Notes = a.Notes,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(new
                {
                    totalCount,
                    page,
                    pageSize,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                    alerts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving speeding alerts");
                return StatusCode(500, new { message = "Error retrieving speeding alerts" });
            }
        }

        /// <summary>
        /// GET: api/SpeedingAlerts/device/{serialNumber}
        /// Get speeding alerts for a specific device
        /// </summary>
        [HttpGet("device/{serialNumber}")]
        public async Task<IActionResult> GetAlertsByDevice(string serialNumber)
        {
            try
            {
                var alerts = await _context.Speeding_Alerts
                    .Include(a => a.Gps_Device)
                    .Where(a => a.DeviceSerialNumber == serialNumber)
                    .OrderByDescending(a => a.Timestamp)
                    .Take(100)
                    .Select(a => new SpeedingAlertDto
                    {
                        Id = a.Id,
                        DeviceSerialNumber = a.DeviceSerialNumber,
                        InstallCarPlate = a.Gps_Device != null ? a.Gps_Device.InstallCarPlate : "Unknown",
                        Timestamp = a.Timestamp,
                        Latitude = a.Latitude,
                        Longitude = a.Longitude,
                        ActualSpeedKmh = a.ActualSpeedKmh,
                        SpeedLimitKmh = a.SpeedLimitKmh,
                        ExceededByKmh = a.ExceededByKmh,
                        ExceededByPercentage = a.ExceededByPercentage,
                        Severity = a.Severity.ToString(),
                        IsAcknowledged = a.IsAcknowledged,
                        AcknowledgedAt = a.AcknowledgedAt,
                        Notes = a.Notes,
                        CreatedAt = a.CreatedAt
                    })
                    .ToListAsync();

                return Ok(alerts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alerts for device {Serial}", serialNumber);
                return StatusCode(500, new { message = "Error retrieving device alerts" });
            }
        }

        /// <summary>
        /// GET: api/SpeedingAlerts/stats
        /// Get speeding statistics summary
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetStatistics([FromQuery] DateTime? fromDate = null)
        {
            try
            {
                var query = _context.Speeding_Alerts.AsQueryable();

                if (fromDate.HasValue)
                    query = query.Where(a => a.Timestamp >= fromDate.Value);

                var stats = new
                {
                    totalAlerts = await query.CountAsync(),
                    unacknowledgedAlerts = await query.CountAsync(a => !a.IsAcknowledged),
                    bySeverity = await query
                        .GroupBy(a => a.Severity)
                        .Select(g => new { severity = g.Key.ToString(), count = g.Count() })
                        .ToListAsync(),
                    topSpeeders = await query
                        .GroupBy(a => a.DeviceSerialNumber)
                        .Select(g => new
                        {
                            deviceSerial = g.Key,
                            alertCount = g.Count(),
                            avgExceededBy = g.Average(a => a.ExceededByKmh)
                        })
                        .OrderByDescending(x => x.alertCount)
                        .Take(10)
                        .ToListAsync()
                };

                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving speeding statistics");
                return StatusCode(500, new { message = "Error retrieving statistics" });
            }
        }

        /// <summary>
        /// PUT: api/SpeedingAlerts/{id}/acknowledge
        /// Acknowledge a speeding alert
        /// </summary>
        [HttpPut("{id}/acknowledge")]
        public async Task<IActionResult> AcknowledgeAlert(Guid id, [FromBody] AcknowledgeAlertDto dto)
        {
            try
            {
                var alert = await _context.Speeding_Alerts.FindAsync(id);

                if (alert == null)
                    return NotFound(new { message = "Alert not found" });

                alert.IsAcknowledged = true;
                alert.AcknowledgedAt = DateTime.UtcNow;
                alert.AcknowledgedBy = dto.AcknowledgedBy;
                alert.Notes = dto.Notes;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Speeding alert {AlertId} acknowledged by {User}", id, dto.AcknowledgedBy);

                return Ok(new { message = "Alert acknowledged successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error acknowledging alert {AlertId}", id);
                return StatusCode(500, new { message = "Error acknowledging alert" });
            }
        }

        /// <summary>
        /// DELETE: api/SpeedingAlerts/{id}
        /// Delete a speeding alert
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAlert(Guid id)
        {
            try
            {
                var alert = await _context.Speeding_Alerts.FindAsync(id);

                if (alert == null)
                    return NotFound(new { message = "Alert not found" });

                _context.Speeding_Alerts.Remove(alert);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Speeding alert {AlertId} deleted", id);

                return Ok(new { message = "Alert deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting alert {AlertId}", id);
                return StatusCode(500, new { message = "Error deleting alert" });
            }
        }
    }

    #region DTOs

    public class SpeedingAlertDto
    {
        public Guid Id { get; set; }
        public string DeviceSerialNumber { get; set; }
        public string InstallCarPlate { get; set; }
        public DateTime Timestamp { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double ActualSpeedKmh { get; set; }
        public int SpeedLimitKmh { get; set; }
        public double ExceededByKmh { get; set; }
        public double ExceededByPercentage { get; set; }
        public string Severity { get; set; }
        public bool IsAcknowledged { get; set; }
        public DateTime? AcknowledgedAt { get; set; }
        public string? AcknowledgedBy { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AcknowledgeAlertDto
    {
        public string AcknowledgedBy { get; set; }
        public string? Notes { get; set; }
    }

    #endregion
}