using React_Rentify.Server.Models.Notifications;

namespace React_Rentify.Server.DTOs.Notifications
{
    /// <summary>
    /// Predefined notification templates for consistent messaging
    /// These are used by the NotificationService to generate notifications
    /// </summary>
    public static class NotificationTemplates
    {
        // ============================
        // Reservation Templates
        // ============================

        public static class Reservation
        {
            public static NotificationTemplate PendingApproval(string carPlate, string customerName) => new()
            {
                Type = NotificationType.Reservation,
                Severity = NotificationSeverity.Warning,
                Title = "newReservationPending",
                Message = $"N : {carPlate} => {customerName}",
                Icon = "clock",
                ActionUrl = "/reservations"
            };

            public static NotificationTemplate Approved(string carPlate, DateTime startDate) => new()
            {
                Type = NotificationType.Reservation,
                Severity = NotificationSeverity.Info,
                Title = "reservationApproved",
                Message = $"N: {carPlate} => {startDate:MMM dd}",
                Icon = "check-circle",
                ActionUrl = "/reservations"
            };

            public static NotificationTemplate OverdueReturn(string carPlate, string customerName, int hoursOverdue) => new()
            {
                Type = NotificationType.Reservation,
                Severity = NotificationSeverity.Critical,
                Title = "overdueReturn",
                Message = $"{carPlate} => {hoursOverdue}h => {customerName}",
                Icon = "alert-triangle",
                ActionUrl = "/reservations"
            };

            public static NotificationTemplate PickupReminder(string carPlate, string customerName, DateTime pickupTime) => new()
            {
                Type = NotificationType.Reservation,
                Severity = NotificationSeverity.Info,
                Title = "upcomingPickup",
                Message = $"{customerName} => {carPlate} => {pickupTime:HH:mm}",
                Icon = "calendar",
                ActionUrl = "/reservations",
                ExpiresAt = pickupTime.AddHours(2)
            };

            public static NotificationTemplate ReturnReminder(string carPlate, DateTime returnTime) => new()
            {
                Type = NotificationType.Reservation,
                Severity = NotificationSeverity.Info,
                Title = "upcomingReturn",
                Message = $"{carPlate} => {returnTime:HH:mm}",
                Icon = "calendar",
                ActionUrl = "/reservations",
                ExpiresAt = returnTime.AddHours(2)
            };
        }

        // ============================
        // GPS Templates
        // ============================

        public static class GPS
        {
            public static NotificationTemplate GeofenceViolation(string carPlate, string location) => new()
            {
                Type = NotificationType.GPS,
                Severity = NotificationSeverity.Critical,
                Title = "geofenceViolation",
                Message = $"{carPlate} => {location}",
                Icon = "map-pin",
                ActionUrl = "/gps/cars"
            };

            public static NotificationTemplate SpeedViolation(string carPlate, double speed, double limit) => new()
            {
                Type = NotificationType.GPS,
                Severity = NotificationSeverity.Warning,
                Title = "speedViolation",
                Message = $"{carPlate} => {speed:F0} km/h (limit: {limit:F0})",
                Icon = "zap",
                ActionUrl = "/gps/cars"
            };

            public static NotificationTemplate UnauthorizedMovement(string carPlate) => new()
            {
                Type = NotificationType.GPS,
                Severity = NotificationSeverity.Critical,
                Title = "unauthorizedMovement",
                Message = $"{carPlate} is moving without an active reservation",
                Icon = "alert-octagon",
                ActionUrl = "/gps/cars"
            };

            public static NotificationTemplate DeviceOffline(string carPlate, string serialNumber, int hoursOffline) => new()
            {
                Type = NotificationType.GPS,
                Severity = NotificationSeverity.Warning,
                Title = "gpsDeviceOffline",
                Message = $"{carPlate} GPS device ({serialNumber}) offline for {hoursOffline}h",
                Icon = "wifi-off",
                ActionUrl = "/gps/devices"
            };

            public static NotificationTemplate LowBattery(string carPlate, int batteryPercent) => new()
            {
                Type = NotificationType.GPS,
                Severity = NotificationSeverity.Warning,
                Title = "lowGPSBattery",
                Message = $"{carPlate} GPS device battery at {batteryPercent}%",
                Icon = "battery",
                ActionUrl = "/gps/devices"
            };
        }

        // ============================
        // Maintenance Templates
        // ============================

        public static class Maintenance
        {
            public static NotificationTemplate ServiceDueSoon(string carPlate, string serviceType, int daysUntil) => new()
            {
                Type = NotificationType.Maintenance,
                Severity = NotificationSeverity.Info,
                Title = "serviceDueSoon",
                Message = $"{carPlate} {serviceType} due in {daysUntil} days",
                Icon = "tool",
                ActionUrl = "/service-alerts"
            };

            public static NotificationTemplate ServiceOverdue(string carPlate, string serviceType, int daysOverdue) => new()
            {
                Type = NotificationType.Maintenance,
                Severity = NotificationSeverity.Critical,
                Title = "serviceOverdue",
                Message = $"{carPlate} {serviceType} overdue by {daysOverdue} days",
                Icon = "alert-circle",
                ActionUrl = "/service-alerts"
            };

            public static NotificationTemplate MileageThreshold(string carPlate, int currentKm, int thresholdKm) => new()
            {
                Type = NotificationType.Maintenance,
                Severity = NotificationSeverity.Warning,
                Title = "mileageThreshold",
                Message = $"{carPlate} reached {currentKm:N0} km (threshold: {thresholdKm:N0})",
                Icon = "activity",
                ActionUrl = "/service-alerts"
            };

            public static NotificationTemplate MaintenanceCompleted(string carPlate, string serviceType) => new()
            {
                Type = NotificationType.Maintenance,
                Severity = NotificationSeverity.Info,
                Title = "maintenanceCompleted",
                Message = $"{carPlate} {serviceType} has been completed",
                Icon = "check",
                ActionUrl = "/maintenances"
            };
        }

        // ============================
        // System Templates
        // ============================

        public static class System
        {
            public static NotificationTemplate LowFleetAvailability(int availableCount, int totalCount, double percentage) => new()
            {
                Type = NotificationType.System,
                Severity = NotificationSeverity.Warning,
                Title = "lowFleetAvailability",
                Message = $"Only {availableCount} of {totalCount} cars available ({percentage:F0}%)",
                Icon = "alert-triangle",
                ActionUrl = "/dashboard"
            };

            public static NotificationTemplate SubscriptionExpiring(string agencyName, int daysRemaining) => new()
            {
                Type = NotificationType.System,
                Severity = NotificationSeverity.Warning,
                Title = "subscriptionExpiring",
                Message = $"{agencyName} subscription expires in {daysRemaining} days",
                Icon = "calendar",
                ActionUrl = "/subscriptions"
            };

            public static NotificationTemplate BackupCompleted(DateTime backupTime) => new()
            {
                Type = NotificationType.System,
                Severity = NotificationSeverity.Info,
                Title = "backupCompleted",
                Message = $"Daily backup completed at {backupTime:HH:mm}",
                Icon = "database",
                ActionUrl = null,
                ExpiresAt = DateTime.UtcNow.AddHours(24)
            };

            public static NotificationTemplate BackupFailed(string reason) => new()
            {
                Type = NotificationType.System,
                Severity = NotificationSeverity.Critical,
                Title = "backupFailed",
                Message = $"Daily backup failed: {reason}",
                Icon = "x-circle",
                ActionUrl = null
            };
        }

        // ============================
        // Security Templates
        // ============================

        public static class Security
        {
            public static NotificationTemplate MultipleFailedLogins(string email, int attemptCount, string ipAddress) => new()
            {
                Type = NotificationType.Security,
                Severity = NotificationSeverity.Critical,
                Title = "Security Alert",
                Message = $"{attemptCount} failed login attempts for {email} from {ipAddress}",
                Icon = "shield-alert",
                ActionUrl = null
            };

            public static NotificationTemplate NewDeviceLogin(string deviceInfo, string location) => new()
            {
                Type = NotificationType.Security,
                Severity = NotificationSeverity.Warning,
                Title = "New Device Login",
                Message = $"Login from new device: {deviceInfo} ({location})",
                Icon = "smartphone",
                ActionUrl = null
            };

            public static NotificationTemplate PasswordChanged() => new()
            {
                Type = NotificationType.Security,
                Severity = NotificationSeverity.Info,
                Title = "Password Changed",
                Message = "Your password was successfully changed",
                Icon = "lock",
                ActionUrl = null
            };
        }

        // ============================
        // Fleet Templates
        // ============================

        public static class Fleet
        {
            public static NotificationTemplate CarStatusChanged(string carPlate, string oldStatus, string newStatus) => new()
            {
                Type = NotificationType.Fleet,
                Severity = NotificationSeverity.Info,
                Title = "Car Status Changed",
                Message = $"{carPlate} status: {oldStatus} → {newStatus}",
                Icon = "refresh-cw",
                ActionUrl = "/cars"
            };

            public static NotificationTemplate CarRetired(string carPlate) => new()
            {
                Type = NotificationType.Fleet,
                Severity = NotificationSeverity.Info,
                Title = "Car Retired",
                Message = $"{carPlate} has been retired from the fleet",
                Icon = "archive",
                ActionUrl = "/cars"
            };
        }

        // ============================
        // Ticket Templates
        // ============================

        public static class Ticket
        {
            public static NotificationTemplate TicketAssigned(string ticketId, string title) => new()
            {
                Type = NotificationType.Ticket,
                Severity = NotificationSeverity.Info,
                Title = "ticketAssigned",
                Message = $"Ticket #{ticketId} assigned to you: {title}",
                Icon = "inbox",
                ActionUrl = $"/tickets/{ticketId}"
            };

            public static NotificationTemplate TicketStatusChanged(string ticketId, string oldStatus, string newStatus) => new()
            {
                Type = NotificationType.Ticket,
                Severity = NotificationSeverity.Info,
                Title = "ticketUpdated",
                Message = $"Ticket #{ticketId} status: {oldStatus} → {newStatus}",
                Icon = "file-text",
                ActionUrl = $"/tickets/{ticketId}"
            };

            public static NotificationTemplate TicketCommentAdded(string ticketId, string commenterName) => new()
            {
                Type = NotificationType.Ticket,
                Severity = NotificationSeverity.Info,
                Title = "New Comment",
                Message = $"{commenterName} commented on ticket #{ticketId}",
                Icon = "message-circle",
                ActionUrl = $"/tickets/{ticketId}"
            };
        }

        // ============================
        // Expense Templates
        // ============================

        public static class Expense
        {
            public static NotificationTemplate ExpenseRequiresApproval(string carPlate, decimal amount, string category) => new()
            {
                Type = NotificationType.Expense,
                Severity = NotificationSeverity.Warning,
                Title = "Expense Approval Required",
                Message = $"{carPlate} - {category}: ${amount:N2} needs approval",
                Icon = "dollar-sign",
                ActionUrl = "/expenses"
            };

            public static NotificationTemplate ExpenseApproved(string carPlate, decimal amount) => new()
            {
                Type = NotificationType.Expense,
                Severity = NotificationSeverity.Info,
                Title = "Expense Approved",
                Message = $"{carPlate} expense of ${amount:N2} approved",
                Icon = "check",
                ActionUrl = "/expenses"
            };

            public static NotificationTemplate ExpenseRejected(string carPlate, decimal amount, string reason) => new()
            {
                Type = NotificationType.Expense,
                Severity = NotificationSeverity.Warning,
                Title = "Expense Rejected",
                Message = $"{carPlate} expense rejected: {reason}",
                Icon = "x",
                ActionUrl = "/expenses"
            };
        }

        // ============================
        // Invoice Templates
        // ============================

        public static class Invoice
        {
            public static NotificationTemplate InvoiceGenerated(string invoiceNumber, string customerName, decimal amount) => new()
            {
                Type = NotificationType.Invoice,
                Severity = NotificationSeverity.Info,
                Title = "invoiceGenerated",
                Message = $"Invoice #{invoiceNumber} for {customerName}: ${amount:N2}",
                Icon = "file",
                ActionUrl = "/invoices"
            };

            public static NotificationTemplate InvoicePaid(string invoiceNumber, decimal amount) => new()
            {
                Type = NotificationType.Invoice,
                Severity = NotificationSeverity.Info,
                Title = "invoicePaid",
                Message = $"Invoice #{invoiceNumber} paid: ${amount:N2}",
                Icon = "check-circle",
                ActionUrl = "/invoices"
            };

            public static NotificationTemplate InvoiceOverdue(string invoiceNumber, string customerName, int daysOverdue) => new()
            {
                Type = NotificationType.Invoice,
                Severity = NotificationSeverity.Warning,
                Title = "invoiceOverdue",
                Message = $"Invoice #{invoiceNumber} for {customerName} overdue by {daysOverdue} days",
                Icon = "alert-circle",
                ActionUrl = "/invoices"
            };
        }
    }

    /// <summary>
    /// Notification template helper class
    /// </summary>
    public class NotificationTemplate
    {
        public NotificationType Type { get; set; }
        public NotificationSeverity Severity { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string? Icon { get; set; }
        public string? ActionUrl { get; set; }
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// Convert template to CreateNotificationDto
        /// </summary>
        public CreateNotificationDto ToDto(string userId, Guid? agencyId, Guid? entityId = null, object? data = null)
        {
            return new CreateNotificationDto
            {
                UserId = userId,
                AgencyId = agencyId,
                Type = Type,
                Severity = Severity,
                Title = Title,
                Message = Message,
                Icon = Icon,
                ActionUrl = ActionUrl,
                EntityId = entityId,
                Data = data,
                ExpiresAt = ExpiresAt
            };
        }
    }
}
