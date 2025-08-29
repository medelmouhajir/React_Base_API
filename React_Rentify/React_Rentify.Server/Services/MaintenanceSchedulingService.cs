using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Controllers.App;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Maintenances;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace React_Rentify.Server.Services
{
    /// <summary>
    /// Background service that automatically generates maintenance records from service alerts
    /// and manages periodic maintenance scheduling
    /// </summary>
    public class MaintenanceSchedulingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MaintenanceSchedulingService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromHours(10); // Check every hour

        public MaintenanceSchedulingService(
            IServiceProvider serviceProvider,
            ILogger<MaintenanceSchedulingService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Maintenance Scheduling Service started");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var context = scope.ServiceProvider.GetRequiredService<MainDbContext>();

                    await ProcessServiceAlerts(context);
                    await GeneratePeriodicAlerts(context);
                    await CleanupOldResolvedAlerts(context);

                    _logger.LogDebug("Maintenance scheduling check completed");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred during maintenance scheduling");
                }

                await Task.Delay(_checkInterval, stoppingToken);
            }

            _logger.LogInformation("Maintenance Scheduling Service stopped");
        }

        /// <summary>
        /// Process service alerts that are due and create maintenance records
        /// </summary>
        private async Task ProcessServiceAlerts(MainDbContext context)
        {
            var dueAlerts = await context.Set<Service_Alert>()
                .Include(a => a.Car)
                .Where(a => !a.IsResolved &&
                           a.DueDate <= DateTime.UtcNow.AddDays(7)) // Alerts due within a week
                .ToListAsync();

            int maintenanceRecordsCreated = 0;

            foreach (var alert in dueAlerts)
            {
                // Check if a maintenance record already exists for this alert
                var existingMaintenance = await context.Set<Maintenance_Record>()
                    .FirstOrDefaultAsync(m => m.CarId == alert.CarId &&
                                            m.Description.Contains(GetMaintenanceDescription(alert.AlertType)) &&
                                            !m.IsCompleted &&
                                            Math.Abs((m.ScheduledDate - alert.DueDate).TotalDays) <= 7);

                if (existingMaintenance == null)
                {
                    var maintenanceRecord = new Maintenance_Record
                    {
                        Id = Guid.NewGuid(),
                        CarId = alert.CarId,
                        ScheduledDate = alert.DueDate,
                        Description = GetMaintenanceDescription(alert.AlertType),
                        Cost = GetEstimatedCost(alert.AlertType),
                        IsCompleted = false,
                        Remarks = $"Auto-generated from service alert. {alert.Notes ?? ""}".Trim()
                    };

                    context.Set<Maintenance_Record>().Add(maintenanceRecord);
                    maintenanceRecordsCreated++;

                    _logger.LogInformation("Created maintenance record for car {CarId}, type {AlertType}",
                        alert.CarId, alert.AlertType);
                }
            }

            if (maintenanceRecordsCreated > 0)
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Created {Count} maintenance records from service alerts",
                    maintenanceRecordsCreated);
            }
        }

        /// <summary>
        /// Generate periodic service alerts for cars that don't have them
        /// </summary>
        private async Task GeneratePeriodicAlerts(MainDbContext context)
        {
            var cars = await context.Set<Car>()
                .Where(c => c.Status != "Retired")
                .ToListAsync();

            int alertsCreated = 0;

            foreach (var car in cars)
            {
                alertsCreated += await GeneratePeriodicAlertsForCar(context, car.Id);
            }

            if (alertsCreated > 0)
            {
                await context.SaveChangesAsync();
                _logger.LogInformation("Generated {Count} periodic service alerts", alertsCreated);
            }
        }

        /// <summary>
        /// Clean up old resolved alerts to keep the database tidy
        /// </summary>
        private async Task CleanupOldResolvedAlerts(MainDbContext context)
        {
            var cutoffDate = DateTime.UtcNow.AddMonths(-6); // Keep resolved alerts for 6 months

            var oldAlerts = await context.Set<Service_Alert>()
                .Where(a => a.IsResolved &&
                           a.ResolvedDate.HasValue &&
                           a.ResolvedDate < cutoffDate)
                .ToListAsync();

            if (oldAlerts.Any())
            {
                context.Set<Service_Alert>().RemoveRange(oldAlerts);
                await context.SaveChangesAsync();

                _logger.LogInformation("Cleaned up {Count} old resolved service alerts", oldAlerts.Count);
            }
        }

        private async Task<int> GeneratePeriodicAlertsForCar(MainDbContext context, Guid carId)
        {
            int alertsCreated = 0;
            var now = DateTime.UtcNow;

            // Define periodic services with their intervals and priorities
            var periodicServices = new[]
            {
                new { Type = Service_Alert_Type.OilChange, IntervalDays = 180, Priority = 1 },
                new { Type = Service_Alert_Type.FluidCheck, IntervalDays = 90, Priority = 2 },
                new { Type = Service_Alert_Type.TireRotation, IntervalDays = 120, Priority = 3 },
                new { Type = Service_Alert_Type.BrakeInspection, IntervalDays = 365, Priority = 4 },
                new { Type = Service_Alert_Type.Drain, IntervalDays = 365, Priority = 5 }
            };

            foreach (var service in periodicServices)
            {
                // Check if there's already an active alert for this service type
                var existingAlert = await context.Set<Service_Alert>()
                    .Where(a => a.CarId == carId &&
                               a.AlertType == service.Type &&
                               !a.IsResolved &&
                               a.DueDate > now.AddDays(-30)) // Don't create if there's one due in the last 30 days
                    .FirstOrDefaultAsync();

                if (existingAlert == null)
                {
                    // Check when this service was last completed
                    var lastCompleted = await context.Set<Service_Alert>()
                        .Where(a => a.CarId == carId &&
                                   a.AlertType == service.Type &&
                                   a.IsResolved)
                        .OrderByDescending(a => a.ResolvedDate)
                        .FirstOrDefaultAsync();

                    DateTime nextDueDate;
                    if (lastCompleted != null && lastCompleted.ResolvedDate.HasValue)
                    {
                        nextDueDate = lastCompleted.ResolvedDate.Value.AddDays(service.IntervalDays);
                    }
                    else
                    {
                        // For new cars, stagger the initial alerts to avoid all services being due at once
                        var offset = service.Priority * 15; // 15 days between each type
                        nextDueDate = now.AddDays(service.IntervalDays - offset);
                    }

                    // Only create alerts for future dates
                    if (nextDueDate > now.AddDays(-7)) // Allow 7 days buffer for overdue
                    {
                        var newAlert = new Service_Alert
                        {
                            Id = Guid.NewGuid(),
                            CarId = carId,
                            AlertType = service.Type,
                            DueDate = nextDueDate,
                            IsResolved = false,
                            Notes = $"Auto-generated periodic {GetAlertTypeName(service.Type).ToLower()} alert"
                        };

                        context.Set<Service_Alert>().Add(newAlert);
                        alertsCreated++;

                        _logger.LogDebug("Generated periodic alert for car {CarId}, type {AlertType}, due {DueDate}",
                            carId, service.Type, nextDueDate);
                    }
                }
            }

            return alertsCreated;
        }

        private static string GetMaintenanceDescription(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => "oil_change_and_filter_replacement",
                Service_Alert_Type.BrakeInspection => "brake_system_inspection_and_service",
                Service_Alert_Type.TireRotation => "tire_rotation_and_pressure_check",
                Service_Alert_Type.FluidCheck => "fluid_levels_check_and_top-up",
                Service_Alert_Type.Drain => "coolant_system_drain_and_refill",
                Service_Alert_Type.Other => "general_maintenance_ervice",
                _ => "scheduled_maintenance"
            };
        }

        private static decimal? GetEstimatedCost(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => 75.00m,
                Service_Alert_Type.BrakeInspection => 120.00m,
                Service_Alert_Type.TireRotation => 45.00m,
                Service_Alert_Type.FluidCheck => 35.00m,
                Service_Alert_Type.Drain => 95.00m,
                Service_Alert_Type.Other => null,
                _ => null
            };
        }

        private static string GetAlertTypeName(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => "oil_change",
                Service_Alert_Type.BrakeInspection => "brake_inspection",
                Service_Alert_Type.TireRotation => "tire_rotation",
                Service_Alert_Type.FluidCheck => "fluid_check",
                Service_Alert_Type.Drain => "drain_service",
                Service_Alert_Type.Other => "other",
                _ => "Unknown"
            };
        }
    }

    /// <summary>
    /// Service for manual maintenance scheduling operations
    /// </summary>
    public interface IMaintenanceSchedulingService
    {
        Task<int> GenerateAlertsForCarAsync(Guid carId);
        Task<int> GenerateAlertsForAgencyAsync(Guid agencyId);
        Task ProcessOverdueAlertsAsync(Guid agencyId);
        Task<MaintenanceScheduleDto> GetMaintenanceScheduleAsync(Guid carId, int monthsAhead = 6);
    }

    public class ManualMaintenanceSchedulingService : IMaintenanceSchedulingService
    {
        private readonly MainDbContext _context;
        private readonly ILogger<ManualMaintenanceSchedulingService> _logger;

        public ManualMaintenanceSchedulingService(
            MainDbContext context,
            ILogger<ManualMaintenanceSchedulingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<int> GenerateAlertsForCarAsync(Guid carId)
        {
            _logger.LogInformation("Generating alerts for car {CarId}", carId);

            var car = await _context.Set<Car>()
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null)
            {
                _logger.LogWarning("Car {CarId} not found", carId);
                return 0;
            }

            return await GeneratePeriodicAlertsForCar(_context, carId);
        }

        public async Task<int> GenerateAlertsForAgencyAsync(Guid agencyId)
        {
            _logger.LogInformation("Generating alerts for agency {AgencyId}", agencyId);

            var cars = await _context.Set<Car>()
                .Where(c => c.AgencyId == agencyId && c.Status != "Retired")
                .ToListAsync();

            int totalAlerts = 0;
            foreach (var car in cars)
            {
                totalAlerts += await GeneratePeriodicAlertsForCar(_context, car.Id);
            }

            if (totalAlerts > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Generated {Count} alerts for agency {AgencyId}", totalAlerts, agencyId);
            }

            return totalAlerts;
        }

        public async Task ProcessOverdueAlertsAsync(Guid agencyId)
        {
            _logger.LogInformation("Processing overdue alerts for agency {AgencyId}", agencyId);

            var overdueAlerts = await _context.Set<Service_Alert>()
                .Include(a => a.Car)
                .Where(a => a.Car.AgencyId == agencyId &&
                           !a.IsResolved &&
                           a.DueDate < DateTime.UtcNow)
                .ToListAsync();

            int maintenanceRecordsCreated = 0;

            foreach (var alert in overdueAlerts)
            {
                // Check if maintenance record already exists
                var existingMaintenance = await _context.Set<Maintenance_Record>()
                    .FirstOrDefaultAsync(m => m.CarId == alert.CarId &&
                                            m.Description.Contains(GetMaintenanceDescription(alert.AlertType)) &&
                                            !m.IsCompleted &&
                                            Math.Abs((m.ScheduledDate - alert.DueDate).TotalDays) <= 30);

                if (existingMaintenance == null)
                {
                    var maintenanceRecord = new Maintenance_Record
                    {
                        Id = Guid.NewGuid(),
                        CarId = alert.CarId,
                        ScheduledDate = DateTime.UtcNow, // Schedule for immediate attention
                        Description = $"OVERDUE: {GetMaintenanceDescription(alert.AlertType)}",
                        Cost = GetEstimatedCost(alert.AlertType),
                        IsCompleted = false,
                        Remarks = $"Generated from overdue service alert. Original due date: {alert.DueDate:yyyy-MM-dd}. {alert.Notes ?? ""}".Trim()
                    };

                    _context.Set<Maintenance_Record>().Add(maintenanceRecord);
                    maintenanceRecordsCreated++;

                    // Update car status to maintenance if it's currently available
                    var car = alert.Car;
                    if (car != null && car.Status == "Available")
                    {
                        car.Status = "Maintenance";
                        _context.Entry(car).State = EntityState.Modified;
                    }
                }
            }

            if (maintenanceRecordsCreated > 0)
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created {Count} maintenance records from overdue alerts", maintenanceRecordsCreated);
            }
        }

        public async Task<MaintenanceScheduleDto> GetMaintenanceScheduleAsync(Guid carId, int monthsAhead = 6)
        {
            var car = await _context.Set<Car>()
                .Include(c => c.Car_Model)
                .ThenInclude(m => m.Manufacturer)
                .Include(c => c.Car_Year)
                .FirstOrDefaultAsync(c => c.Id == carId);

            if (car == null)
            {
                throw new ArgumentException($"Car with ID {carId} not found");
            }

            var endDate = DateTime.UtcNow.AddMonths(monthsAhead);

            // Get upcoming service alerts
            var upcomingAlerts = await _context.Set<Service_Alert>()
                .Where(a => a.CarId == carId &&
                           !a.IsResolved &&
                           a.DueDate <= endDate)
                .OrderBy(a => a.DueDate)
                .ToListAsync();

            // Get scheduled maintenance records
            var scheduledMaintenance = await _context.Set<Maintenance_Record>()
                .Where(m => m.CarId == carId &&
                           !m.IsCompleted &&
                           m.ScheduledDate <= endDate)
                .OrderBy(m => m.ScheduledDate)
                .ToListAsync();

            // Get recent completed maintenance
            var recentCompleted = await _context.Set<Maintenance_Record>()
                .Where(m => m.CarId == carId &&
                           m.IsCompleted &&
                           m.CompletedDate >= DateTime.UtcNow.AddMonths(-6))
                .OrderByDescending(m => m.CompletedDate)
                .Take(10)
                .ToListAsync();

            return new MaintenanceScheduleDto
            {
                CarId = carId,
                CarInfo = new CarInfoDto
                {
                    LicensePlate = car.LicensePlate,
                    Manufacturer = car.Car_Model?.Manufacturer?.Name ?? "Unknown",
                    Model = car.Car_Model?.Name ?? "Unknown",
                    Year = car.Car_Year?.YearValue ?? 0
                },
                UpcomingAlerts = upcomingAlerts.Select(a => new ServiceAlertDto
                {
                    Id = a.Id,
                    CarId = a.CarId,
                    AlertType = a.AlertType,
                    AlertTypeName = GetAlertTypeName(a.AlertType),
                    DueDate = a.DueDate,
                    DueMileage = a.DueMileage,
                    IsResolved = a.IsResolved,
                    Notes = a.Notes,
                    IsOverdue = a.DueDate < DateTime.UtcNow,
                    DaysUntilDue = (int)(a.DueDate - DateTime.UtcNow).TotalDays
                }).ToList(),
                ScheduledMaintenance = scheduledMaintenance.Select(m => new MaintenanceRecordDto
                {
                    Id = m.Id,
                    CarId = m.CarId,
                    ScheduledDate = m.ScheduledDate,
                    Description = m.Description,
                    Cost = m.Cost,
                    IsCompleted = m.IsCompleted,
                    Remarks = m.Remarks
                }).ToList(),
                RecentCompleted = recentCompleted.Select(m => new MaintenanceRecordDto
                {
                    Id = m.Id,
                    CarId = m.CarId,
                    ScheduledDate = m.ScheduledDate,
                    Description = m.Description,
                    Cost = m.Cost,
                    IsCompleted = m.IsCompleted,
                    CompletedDate = m.CompletedDate,
                    Remarks = m.Remarks
                }).ToList()
            };
        }

        // Helper methods (same as in the background service)
        private async Task<int> GeneratePeriodicAlertsForCar(MainDbContext context, Guid carId)
        {
            int alertsCreated = 0;
            var now = DateTime.UtcNow;

            var periodicServices = new[]
            {
                new { Type = Service_Alert_Type.OilChange, IntervalDays = 180, Priority = 1 },
                new { Type = Service_Alert_Type.FluidCheck, IntervalDays = 90, Priority = 2 },
                new { Type = Service_Alert_Type.TireRotation, IntervalDays = 120, Priority = 3 },
                new { Type = Service_Alert_Type.BrakeInspection, IntervalDays = 365, Priority = 4 },
                new { Type = Service_Alert_Type.Drain, IntervalDays = 365, Priority = 5 }
            };

            foreach (var service in periodicServices)
            {
                var existingAlert = await context.Set<Service_Alert>()
                    .Where(a => a.CarId == carId &&
                               a.AlertType == service.Type &&
                               !a.IsResolved &&
                               a.DueDate > now.AddDays(-30))
                    .FirstOrDefaultAsync();

                if (existingAlert == null)
                {
                    var lastCompleted = await context.Set<Service_Alert>()
                        .Where(a => a.CarId == carId &&
                                   a.AlertType == service.Type &&
                                   a.IsResolved)
                        .OrderByDescending(a => a.ResolvedDate)
                        .FirstOrDefaultAsync();

                    DateTime nextDueDate;
                    if (lastCompleted != null && lastCompleted.ResolvedDate.HasValue)
                    {
                        nextDueDate = lastCompleted.ResolvedDate.Value.AddDays(service.IntervalDays);
                    }
                    else
                    {
                        var offset = service.Priority * 15;
                        nextDueDate = now.AddDays(service.IntervalDays - offset);
                    }

                    if (nextDueDate > now.AddDays(-7))
                    {
                        var newAlert = new Service_Alert
                        {
                            Id = Guid.NewGuid(),
                            CarId = carId,
                            AlertType = service.Type,
                            DueDate = nextDueDate,
                            IsResolved = false,
                            Notes = $"Auto-generated periodic {GetAlertTypeName(service.Type).ToLower()} alert"
                        };

                        context.Set<Service_Alert>().Add(newAlert);
                        alertsCreated++;
                    }
                }
            }

            return alertsCreated;
        }

        private static string GetMaintenanceDescription(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => "Oil Change and Filter Replacement",
                Service_Alert_Type.BrakeInspection => "Brake System Inspection and Service",
                Service_Alert_Type.TireRotation => "Tire Rotation and Pressure Check",
                Service_Alert_Type.FluidCheck => "Fluid Levels Check and Top-up",
                Service_Alert_Type.Drain => "Coolant System Drain and Refill",
                Service_Alert_Type.Other => "General Maintenance Service",
                _ => "Scheduled Maintenance"
            };
        }

        private static decimal? GetEstimatedCost(Service_Alert_Type alertType)
        {
            return alertType switch
            {
                Service_Alert_Type.OilChange => 75.00m,
                Service_Alert_Type.BrakeInspection => 120.00m,
                Service_Alert_Type.TireRotation => 45.00m,
                Service_Alert_Type.FluidCheck => 35.00m,
                Service_Alert_Type.Drain => 95.00m,
                Service_Alert_Type.Other => null,
                _ => null
            };
        }

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
    }

    #region DTOs for Scheduling Service

    public class MaintenanceScheduleDto
    {
        public Guid CarId { get; set; }
        public CarInfoDto CarInfo { get; set; }
        public List<ServiceAlertDto> UpcomingAlerts { get; set; } = new();
        public List<MaintenanceRecordDto> ScheduledMaintenance { get; set; } = new();
        public List<MaintenanceRecordDto> RecentCompleted { get; set; } = new();
    }

    public class MaintenanceRecordDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Description { get; set; }
        public decimal? Cost { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string? Remarks { get; set; }
    }

    #endregion
}