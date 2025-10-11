// React_Rentify.Server/BackgroundServices/NotificationCheckerService.cs

using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.DTOs.Notifications;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.GPS.Records;
using React_Rentify.Server.Models.Notifications;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Subscriptions;
using React_Rentify.Server.Services;

namespace React_Rentify.Server.BackgroundServices
{
    /// <summary>
    /// Background service that periodically checks for conditions requiring notifications
    /// Runs every minute and triggers alerts for:
    /// - Overdue reservations
    /// - Service alerts due/overdue
    /// - GPS device offline status
    /// - Low fleet availability
    /// - Subscription expiration warnings
    /// </summary>
    public class NotificationCheckerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NotificationCheckerService> _logger;
        private DateTime _lastReservationCheck = DateTime.MinValue;
        private DateTime _lastMaintenanceCheck = DateTime.MinValue;
        private DateTime _lastGPSCheck = DateTime.MinValue;
        private DateTime _lastFleetCheck = DateTime.MinValue;
        private DateTime _lastSubscriptionCheck = DateTime.MinValue;

        public NotificationCheckerService(
            IServiceProvider serviceProvider,
            ILogger<NotificationCheckerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Notification Checker Service started");

            // Wait 30 seconds before first run to allow app initialization
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await RunChecksAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in notification checker service");
                }

                // Run every minute
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Notification Checker Service stopped");
        }

        private async Task RunChecksAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MainDbContext>();
            var gpsContext = scope.ServiceProvider.GetRequiredService<GpsDbContext>();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var now = DateTime.UtcNow;

            // Check overdue reservations (every 5 minutes)
            if ((now - _lastReservationCheck).TotalMinutes >= 5)
            {
                await CheckOverdueReservationsAsync(context, notificationService, stoppingToken);
                _lastReservationCheck = now;
            }

            // Check maintenance alerts (every hour)
            if ((now - _lastMaintenanceCheck).TotalHours >= 1)
            {
                await CheckMaintenanceAlertsAsync(context, notificationService, stoppingToken);
                _lastMaintenanceCheck = now;
            }

            // Check GPS device status (every 15 minutes)
            if ((now - _lastGPSCheck).TotalMinutes >= 15)
            {
                await CheckGPSDeviceStatusAsync(context, gpsContext, notificationService, stoppingToken);
                _lastGPSCheck = now;
            }

            // Check fleet availability (every 30 minutes)
            if ((now - _lastFleetCheck).TotalMinutes >= 30)
            {
                await CheckFleetAvailabilityAsync(context, notificationService, stoppingToken);
                _lastFleetCheck = now;
            }

            // Check subscription expiration (once per day at 9 AM UTC)
            if (now.Hour == 9 && (now - _lastSubscriptionCheck).TotalHours >= 23)
            {
                await CheckSubscriptionExpirationAsync(context, notificationService, stoppingToken);
                _lastSubscriptionCheck = now;
            }

            // Cleanup expired notifications (once per day at 2 AM UTC)
            if (now.Hour == 2 && now.Minute == 0)
            {
                await notificationService.CleanupExpiredNotificationsAsync();
                await notificationService.CleanupOldReadNotificationsAsync(30);
            }
        }

        // ============================
        // Check Methods
        // ============================

        /// <summary>
        /// Check for overdue reservations and send alerts
        /// </summary>
        private async Task CheckOverdueReservationsAsync(
            MainDbContext context,
            INotificationService notificationService,
            CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Checking for overdue reservations...");

                var overdueReservations = await context.Set<Reservation>()
                    .Include(r => r.Car)
                    .ThenInclude(c => c.Car_Model)
                    .Include(r => r.Reservation_Customers)
                    .ThenInclude(x=> x.Customer)
                    .Where(r => r.Status == "Ongoing" &&
                               r.EndDate < DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Found {Count} overdue reservations", overdueReservations.Count);

                foreach (var reservation in overdueReservations)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var hoursOverdue = (int)(DateTime.UtcNow - reservation.EndDate).TotalHours;

                    // Only send notification if overdue by at least 1 hour
                    if (hoursOverdue < 1) continue;

                    var carPlate = reservation.Car?.LicensePlate ?? "Unknown";
                    var customerName = reservation.Reservation_Customers?.FirstOrDefault()?.Customer?.FullName ?? "Unknown";

                    var template = NotificationTemplates.Reservation.OverdueReturn(
                        carPlate,
                        customerName,
                        hoursOverdue
                    );

                    // Send to agency managers
                    await notificationService.BroadcastToAgencyAsync(
                        reservation.Car.AgencyId,
                        template,
                        reservation.Id,
                        new { reservationId = reservation.Id, carPlate, customerName, hoursOverdue }
                    );

                    _logger.LogInformation("Sent overdue notification for reservation {ReservationId}, car {CarPlate}, {Hours}h overdue",
                        reservation.Id, carPlate, hoursOverdue);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking overdue reservations");
            }
        }

        /// <summary>
        /// Check for maintenance alerts that are due or overdue
        /// </summary>
        private async Task CheckMaintenanceAlertsAsync(
            MainDbContext context,
            INotificationService notificationService,
            CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Checking maintenance alerts...");

                var now = DateTime.UtcNow;
                var sevenDaysFromNow = now.AddDays(7);

                // Get alerts due within 7 days or already overdue
                var alerts = await context.Set<Service_Alert>()
                    .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                    .Where(a => !a.IsResolved &&
                               a.DueDate <= sevenDaysFromNow)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Found {Count} maintenance alerts requiring attention", alerts.Count);

                foreach (var alert in alerts)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var carPlate = alert.Car?.LicensePlate ?? "Unknown";
                    var serviceType = alert.AlertType.ToString();
                    var daysUntilDue = (int)(alert.DueDate - now).TotalDays;
                    var isOverdue = daysUntilDue < 0;

                    NotificationTemplate template;

                    if (isOverdue)
                    {
                        template = NotificationTemplates.Maintenance.ServiceOverdue(
                            carPlate,
                            serviceType,
                            Math.Abs(daysUntilDue)
                        );
                    }
                    else
                    {
                        template = NotificationTemplates.Maintenance.ServiceDueSoon(
                            carPlate,
                            serviceType,
                            daysUntilDue
                        );
                    }

                    // Send to agency managers
                    await notificationService.BroadcastToAgencyAsync(
                        alert.Car.AgencyId,
                        template,
                        alert.Id,
                        new { alertId = alert.Id, carPlate, serviceType, daysUntilDue, isOverdue }
                    );

                    _logger.LogInformation("Sent maintenance alert for car {CarPlate}, service {Service}, due in {Days} days",
                        carPlate, serviceType, daysUntilDue);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking maintenance alerts");
            }
        }

        /// <summary>
        /// Check for GPS devices that are offline
        /// </summary>
        private async Task CheckGPSDeviceStatusAsync(
            MainDbContext context,
            GpsDbContext gpsContext,
            INotificationService notificationService,
            CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Checking GPS device status...");

                // Query cars with GPS tracking enabled
                var carsWithGPS = await context.Cars
                    .Where(c => c.IsTrackingActive && !string.IsNullOrEmpty(c.DeviceSerialNumber))
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Found {Count} cars with GPS tracking enabled", carsWithGPS.Count);

                var oneHourAgo = DateTime.UtcNow.AddHours(-1);

                foreach (var car in carsWithGPS)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    // Check if device has sent data in the last hour
                    var hasRecentData = await gpsContext.Location_Records
                        .AnyAsync(r => r.DeviceSerialNumber == car.DeviceSerialNumber &&
                                      r.Timestamp >= oneHourAgo,
                                 stoppingToken);

                    if (!hasRecentData)
                    {
                        var template = NotificationTemplates.GPS.DeviceOffline(
                            car.LicensePlate,
                            car.DeviceSerialNumber,
                            1
                        );

                        // Send to agency managers
                        await notificationService.BroadcastToAgencyAsync(
                            car.AgencyId,
                            template,
                            car.Id,
                            new { carId = car.Id, carPlate = car.LicensePlate, deviceSerial = car.DeviceSerialNumber }
                        );

                        _logger.LogInformation("Sent GPS offline alert for car {CarPlate}, device {Serial}",
                            car.LicensePlate, car.DeviceSerialNumber);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking GPS device status");
            }
        }

        /// <summary>
        /// Check for low fleet availability and send warnings
        /// </summary>
        private async Task CheckFleetAvailabilityAsync(
            MainDbContext context,
            INotificationService notificationService,
            CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Checking fleet availability...");

                // Get all agencies
                var agencies = await context.Set<Agency>()
                    .Select(a => a.Id)
                    .ToListAsync(stoppingToken);

                foreach (var agencyId in agencies)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var totalCars = await context.Cars
                        .CountAsync(c => c.AgencyId == agencyId, stoppingToken);

                    var availableCars = await context.Cars
                        .CountAsync(c => c.AgencyId == agencyId && c.IsAvailable, stoppingToken);

                    if (totalCars == 0) continue;

                    var availabilityPercentage = (double)availableCars / totalCars * 100;

                    // Alert if availability drops below 20%
                    if (availabilityPercentage < 20)
                    {
                        var template = NotificationTemplates.System.LowFleetAvailability(
                            availableCars,
                            totalCars,
                            availabilityPercentage
                        );

                        await notificationService.BroadcastToAgencyAsync(
                            agencyId,
                            template,
                            null,
                            new { agencyId, availableCars, totalCars, availabilityPercentage }
                        );

                        _logger.LogInformation("Sent low fleet availability alert for agency {AgencyId}: {Available}/{Total} cars",
                            agencyId, availableCars, totalCars);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking fleet availability");
            }
        }

        /// <summary>
        /// Check for subscriptions expiring soon
        /// </summary>
        private async Task CheckSubscriptionExpirationAsync(
            MainDbContext context,
            INotificationService notificationService,
            CancellationToken stoppingToken)
        {
            try
            {
                _logger.LogInformation("Checking subscription expiration...");

                var sevenDaysFromNow = DateTime.UtcNow.AddDays(7);

                var expiringSubscriptions = await context.Set<Agency>()
                    .Include(s => s.CurrentSubscription)
                    .Where(s => s.CurrentSubscription.EndDate <= sevenDaysFromNow && s.CurrentSubscription.EndDate > DateTime.UtcNow)
                    .ToListAsync(stoppingToken);

                _logger.LogInformation("Found {Count} subscriptions expiring soon", expiringSubscriptions.Count);

                foreach (var agency in expiringSubscriptions)
                {
                    if (stoppingToken.IsCancellationRequested) break;

                    var daysRemaining = (int)(agency.CurrentSubscription.EndDate - DateTime.UtcNow).TotalDays;
                    var agencyName = agency.Name ?? "Unknown";

                    var template = NotificationTemplates.System.SubscriptionExpiring(
                        agencyName,
                        daysRemaining
                    );

                    // Send to agency owners and admins
                    await notificationService.BroadcastToAgencyAsync(
                        agency.Id,
                        template,
                        agency.CurrentSubscription.Id,
                        new { subscriptionId = agency.CurrentSubscription.Id, agencyId = agency.Id, agencyName, daysRemaining, expiresAt = agency.CurrentSubscription.EndDate }
                    );

                    _logger.LogInformation("Sent subscription expiration alert for agency {AgencyName}, expires in {Days} days",
                        agencyName, daysRemaining);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking subscription expiration");
            }
        }


    }
}