using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/service-alerts")]
    [Authorize]
    public class ServiceAlertsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<ServiceAlertsController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public ServiceAlertsController(
            MainDbContext context,
            ILogger<ServiceAlertsController> logger,
            IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/service-alerts
        /// Returns all service alerts for the current user's agency
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllServiceAlerts()
        {
            _logger.LogInformation("Retrieving all service alerts");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _context.Users.FindAsync(userId);

            if (user?.AgencyId == null)
            {
                _logger.LogWarning("User {UserId} has no agency", userId);
                return BadRequest(new { message = "User must be associated with an agency." });
            }

            var alerts = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .ThenInclude(c => c.Car_Model)
                .ThenInclude(m => m.Manufacturer)
                .Where(a => a.Car.AgencyId == user.AgencyId)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            var dtoList = alerts.Select(a => new ServiceAlertDto
            {
                Id = a.Id,
                CarId = a.CarId,
                CarInfo = a.Car != null ? new CarInfoDto
                {
                    LicensePlate = a.Car.LicensePlate,
                    Manufacturer = a.Car.Car_Model?.Manufacturer?.Name ?? "Unknown",
                    Model = a.Car.Car_Model?.Name ?? "Unknown",
                    Year = a.Car.Car_Year?.YearValue ?? 0
                } : null,
                AlertType = a.AlertType,
                AlertTypeName = GetAlertTypeName(a.AlertType),
                DueDate = a.DueDate,
                DueMileage = a.DueMileage,
                IsResolved = a.IsResolved,
                ResolvedDate = a.ResolvedDate,
                Notes = a.Notes,
                IsOverdue = !a.IsResolved && a.DueDate < DateTime.UtcNow,
                DaysUntilDue = (int)(a.DueDate - DateTime.UtcNow).TotalDays
            }).ToList();

            _logger.LogInformation("Retrieved {Count} service alerts", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/service-alerts/{id}
        /// Returns a specific service alert
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetServiceAlert(Guid id)
        {
            _logger.LogInformation("Retrieving service alert {AlertId}", id);

            var alert = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .ThenInclude(c => c.Car_Model)
                .ThenInclude(m => m.Manufacturer)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alert == null)
            {
                _logger.LogWarning("Service alert with Id {AlertId} not found", id);
                return NotFound(new { message = $"Service alert with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(alert.Car.AgencyId))
                return Unauthorized();

            var dto = new ServiceAlertDto
            {
                Id = alert.Id,
                CarId = alert.CarId,
                CarInfo = alert.Car != null ? new CarInfoDto
                {
                    LicensePlate = alert.Car.LicensePlate,
                    Manufacturer = alert.Car.Car_Model?.Manufacturer?.Name ?? "Unknown",
                    Model = alert.Car.Car_Model?.Name ?? "Unknown",
                    Year = alert.Car.Car_Year?.YearValue ?? 0
                } : null,
                AlertType = alert.AlertType,
                AlertTypeName = GetAlertTypeName(alert.AlertType),
                DueDate = alert.DueDate,
                DueMileage = alert.DueMileage,
                IsResolved = alert.IsResolved,
                ResolvedDate = alert.ResolvedDate,
                Notes = alert.Notes,
                IsOverdue = !alert.IsResolved && alert.DueDate < DateTime.UtcNow,
                DaysUntilDue = (int)(alert.DueDate - DateTime.UtcNow).TotalDays
            };

            _logger.LogInformation("Retrieved service alert {AlertId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/service-alerts/car/{carId}
        /// Returns all service alerts for a specific car
        /// </summary>
        [HttpGet("car/{carId:guid}")]
        public async Task<IActionResult> GetServiceAlertsByCarId(Guid carId)
        {
            _logger.LogInformation("Retrieving service alerts for car {CarId}", carId);

            var car = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

            var alerts = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .Where(a => a.CarId == carId)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            var dtoList = alerts.Select(a => new ServiceAlertDto
            {
                Id = a.Id,
                CarId = a.CarId,
                AlertType = a.AlertType,
                AlertTypeName = GetAlertTypeName(a.AlertType),
                DueDate = a.DueDate,
                DueMileage = a.DueMileage,
                IsResolved = a.IsResolved,
                ResolvedDate = a.ResolvedDate,
                Notes = a.Notes,
                IsOverdue = !a.IsResolved && a.DueDate < DateTime.UtcNow,
                DaysUntilDue = (int)(a.DueDate - DateTime.UtcNow).TotalDays
            }).ToList();

            _logger.LogInformation("Retrieved {Count} service alerts for car {CarId}", dtoList.Count, carId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/service-alerts
        /// Creates a new service alert
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateServiceAlert([FromBody] CreateServiceAlertDto dto)
        {
            _logger.LogInformation("Creating new service alert for car {CarId}", dto.CarId);

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var car = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == dto.CarId);
            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
            }

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

            var alert = new Service_Alert
            {
                Id = Guid.NewGuid(),
                CarId = dto.CarId,
                AlertType = dto.AlertType,
                DueDate = dto.DueDate.ToUniversalTime(),
                DueMileage = dto.DueMileage,
                IsResolved = false,
                Notes = dto.Notes?.Trim()
            };

            _context.Set<Service_Alert>().Add(alert);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created service alert {AlertId}", alert.Id);

            var resultDto = new ServiceAlertDto
            {
                Id = alert.Id,
                CarId = alert.CarId,
                AlertType = alert.AlertType,
                AlertTypeName = GetAlertTypeName(alert.AlertType),
                DueDate = alert.DueDate,
                DueMileage = alert.DueMileage,
                IsResolved = alert.IsResolved,
                Notes = alert.Notes,
                IsOverdue = false,
                DaysUntilDue = (int)(alert.DueDate - DateTime.UtcNow).TotalDays
            };

            return CreatedAtAction(nameof(GetServiceAlert), new { id = alert.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/service-alerts/{id}
        /// Updates an existing service alert
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateServiceAlert(Guid id, [FromBody] UpdateServiceAlertDto dto)
        {
            _logger.LogInformation("Updating service alert {AlertId}", id);

            if (id != dto.Id)
            {
                _logger.LogWarning("Alert ID mismatch: URL {UrlId} vs Body {BodyId}", id, dto.Id);
                return BadRequest(new { message = "Alert ID mismatch." });
            }

            var existingAlert = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (existingAlert == null)
            {
                _logger.LogWarning("Service alert with Id {AlertId} not found", id);
                return NotFound(new { message = $"Service alert with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(existingAlert.Car.AgencyId))
                return Unauthorized();

            // Update properties
            existingAlert.AlertType = dto.AlertType;
            existingAlert.DueDate = dto.DueDate.ToUniversalTime();
            existingAlert.DueMileage = dto.DueMileage;
            existingAlert.IsResolved = dto.IsResolved;
            existingAlert.ResolvedDate = dto.IsResolved && dto.ResolvedDate.HasValue
                ? dto.ResolvedDate.Value.ToUniversalTime()
                : null;
            existingAlert.Notes = dto.Notes?.Trim();

            _context.Entry(existingAlert).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated service alert {AlertId}", id);

            var resultDto = new ServiceAlertDto
            {
                Id = existingAlert.Id,
                CarId = existingAlert.CarId,
                AlertType = existingAlert.AlertType,
                AlertTypeName = GetAlertTypeName(existingAlert.AlertType),
                DueDate = existingAlert.DueDate,
                DueMileage = existingAlert.DueMileage,
                IsResolved = existingAlert.IsResolved,
                ResolvedDate = existingAlert.ResolvedDate,
                Notes = existingAlert.Notes,
                IsOverdue = !existingAlert.IsResolved && existingAlert.DueDate < DateTime.UtcNow,
                DaysUntilDue = (int)(existingAlert.DueDate - DateTime.UtcNow).TotalDays
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// POST: api/service-alerts/{id}/resolve
        /// Marks a service alert as resolved
        /// </summary>
        [HttpPost("{id:guid}/resolve")]
        public async Task<IActionResult> ResolveServiceAlert(Guid id, [FromBody] ResolveServiceAlertDto dto)
        {
            _logger.LogInformation("Resolving service alert {AlertId}", id);

            var alert = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alert == null)
            {
                _logger.LogWarning("Service alert with Id {AlertId} not found", id);
                return NotFound(new { message = $"Service alert with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(alert.Car.AgencyId))
                return Unauthorized();

            alert.IsResolved = true;
            alert.ResolvedDate = DateTime.UtcNow;
            alert.Notes = dto.Notes?.Trim();

            _context.Entry(alert).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            // Generate next alert if this was a periodic service
            await GenerateNextPeriodicAlert(alert);

            _logger.LogInformation("Resolved service alert {AlertId}", id);
            return Ok();
        }

        /// <summary>
        /// DELETE: api/service-alerts/{id}
        /// Deletes a service alert
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteServiceAlert(Guid id)
        {
            _logger.LogInformation("Deleting service alert {AlertId}", id);

            var alert = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (alert == null)
            {
                _logger.LogWarning("Service alert with Id {AlertId} not found", id);
                return NotFound(new { message = $"Service alert with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(alert.Car.AgencyId))
                return Unauthorized();

            _context.Set<Service_Alert>().Remove(alert);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted service alert {AlertId}", id);
            return NoContent();
        }

        /// <summary>
        /// POST: api/service-alerts/generate-periodic
        /// Generates periodic service alerts for all cars in the agency
        /// </summary>
        [HttpPost("generate-periodic")]
        public async Task<IActionResult> GeneratePeriodicAlerts()
        {
            _logger.LogInformation("Generating periodic service alerts");

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _context.Users.FindAsync(userId);

            if (user?.AgencyId == null)
            {
                return BadRequest(new { message = "User must be associated with an agency." });
            }

            var cars = await _context.Set<Car>()
                .Where(c => c.AgencyId == user.AgencyId)
                .ToListAsync();

            int alertsCreated = 0;

            foreach (var car in cars)
            {
                alertsCreated += await GeneratePeriodicAlertsForCar(car.Id);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Generated {Count} periodic service alerts", alertsCreated);
            return Ok(new { AlertsCreated = alertsCreated });
        }

        #region Private Helper Methods

        private static string GetAlertTypeName(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => "Oil Change",
                Service_Alert_Type.BrakeInspection => "Brake Inspection",
                Service_Alert_Type.TireRotation => "Tire Rotation",
                Service_Alert_Type.FluidCheck => "Fluid Check",
                Service_Alert_Type.Drain => "Drain Service",
                Service_Alert_Type.Other => "Other",
                _ => "Unknown"
            };
        }

        private async Task<int> GeneratePeriodicAlertsForCar(Guid carId)
        {
            int alertsCreated = 0;
            var now = DateTime.UtcNow;

            // Define periodic services with their intervals (in days)
            var periodicServices = new Dictionary<Service_Alert_Type, int>
            {
                { Service_Alert_Type.OilChange, 180 }, // Every 6 months
                { Service_Alert_Type.BrakeInspection, 365 }, // Every year
                { Service_Alert_Type.TireRotation, 120 }, // Every 4 months
                { Service_Alert_Type.FluidCheck, 90 }, // Every 3 months
                { Service_Alert_Type.Drain, 365 } // Every year
            };

            foreach (var service in periodicServices)
            {
                // Check if there's already an active alert for this service type
                var existingAlert = await _context.Set<Service_Alert>()
                    .Where(a => a.CarId == carId &&
                               a.AlertType == service.Key &&
                               !a.IsResolved)
                    .FirstOrDefaultAsync();

                if (existingAlert == null)
                {
                    var newAlert = new Service_Alert
                    {
                        Id = Guid.NewGuid(),
                        CarId = carId,
                        AlertType = service.Key,
                        DueDate = now.AddDays(service.Value),
                        IsResolved = false,
                        Notes = $"Auto-generated periodic {GetAlertTypeName(service.Key).ToLower()} alert"
                    };

                    _context.Set<Service_Alert>().Add(newAlert);
                    alertsCreated++;
                }
            }

            return alertsCreated;
        }

        private async Task GenerateNextPeriodicAlert(Service_Alert resolvedAlert)
        {
            // Define intervals for periodic services
            var intervalDays = resolvedAlert.AlertType switch
            {
                Service_Alert_Type.OilChange => 180, // 6 months
                Service_Alert_Type.BrakeInspection => 365, // 1 year
                Service_Alert_Type.TireRotation => 120, // 4 months
                Service_Alert_Type.FluidCheck => 90, // 3 months
                Service_Alert_Type.Drain => 365, // 1 year
                _ => 0 // No automatic next alert for "Other"
            };

            if (intervalDays > 0)
            {
                var nextAlert = new Service_Alert
                {
                    Id = Guid.NewGuid(),
                    CarId = resolvedAlert.CarId,
                    AlertType = resolvedAlert.AlertType,
                    DueDate = DateTime.UtcNow.AddDays(intervalDays),
                    IsResolved = false,
                    Notes = $"Auto-generated next {GetAlertTypeName(resolvedAlert.AlertType).ToLower()} alert"
                };

                _context.Set<Service_Alert>().Add(nextAlert);
                _logger.LogInformation("Generated next periodic alert for car {CarId}, type {AlertType}",
                    resolvedAlert.CarId, resolvedAlert.AlertType);
            }
        }

        #endregion
    }

    #region DTOs

    public class ServiceAlertDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public CarInfoDto? CarInfo { get; set; }
        public Service_Alert_Type AlertType { get; set; }
        public string AlertTypeName { get; set; }
        public DateTime DueDate { get; set; }
        public int? DueMileage { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ResolvedDate { get; set; }
        public string? Notes { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysUntilDue { get; set; }
    }

    public class CarInfoDto
    {
        public string LicensePlate { get; set; }
        public string Manufacturer { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
    }

    public class CreateServiceAlertDto
    {
        public Guid CarId { get; set; }
        public Service_Alert_Type AlertType { get; set; }
        public DateTime DueDate { get; set; }
        public int? DueMileage { get; set; }
        public string? Notes { get; set; }
    }

    public class UpdateServiceAlertDto
    {
        public Guid Id { get; set; }
        public Service_Alert_Type AlertType { get; set; }
        public DateTime DueDate { get; set; }
        public int? DueMileage { get; set; }
        public bool IsResolved { get; set; }
        public DateTime? ResolvedDate { get; set; }
        public string? Notes { get; set; }
    }

    public class ResolveServiceAlertDto
    {
        public string? Notes { get; set; }
    }

    #endregion
}