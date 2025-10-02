using React_Rentify.Server.Models.Notifications;
using System.ComponentModel.DataAnnotations;

namespace React_Rentify.Server.DTOs.Notifications
{
    // ============================
    // Notification DTOs
    // ============================

    public class NotificationDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; }
        public Guid? AgencyId { get; set; }
        public NotificationType Type { get; set; }
        public string TypeName { get; set; } // Friendly name
        public NotificationSeverity Severity { get; set; }
        public string SeverityName { get; set; } // Friendly name
        public string Title { get; set; }
        public string Message { get; set; }
        public object? Data { get; set; } // Deserialized JSON
        public string? ActionUrl { get; set; }
        public Guid? EntityId { get; set; }
        public string? Icon { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
    }

    public class CreateNotificationDto
    {
        [Required]
        public string UserId { get; set; }

        public Guid? AgencyId { get; set; }

        [Required]
        public NotificationType Type { get; set; }

        [Required]
        public NotificationSeverity Severity { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Message { get; set; }

        public object? Data { get; set; }

        [MaxLength(500)]
        public string? ActionUrl { get; set; }

        public Guid? EntityId { get; set; }

        [MaxLength(50)]
        public string? Icon { get; set; }

        public DateTime? ExpiresAt { get; set; }
    }

    public class MarkNotificationsReadDto
    {
        [Required]
        public List<Guid> NotificationIds { get; set; }
    }

    public class NotificationSummaryDto
    {
        public int TotalCount { get; set; }
        public int UnreadCount { get; set; }
        public int CriticalCount { get; set; }
        public int WarningCount { get; set; }
        public int InfoCount { get; set; }
        public DateTime? LastNotificationAt { get; set; }
    }

    // ============================
    // Push Subscription DTOs
    // ============================

    public class PushSubscriptionDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; }
        public string Endpoint { get; set; }
        public string? DeviceInfo { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreatePushSubscriptionDto
    {
        [Required]
        [MaxLength(500)]
        public string Endpoint { get; set; }

        [Required]
        [MaxLength(200)]
        public string P256dh { get; set; }

        [Required]
        [MaxLength(200)]
        public string Auth { get; set; }

        [MaxLength(100)]
        public string? DeviceInfo { get; set; }
    }

    public class PushNotificationPayloadDto
    {
        public string Title { get; set; }
        public string Body { get; set; }
        public string? Icon { get; set; }
        public string? Badge { get; set; }
        public string? Tag { get; set; }
        public object? Data { get; set; }
    }

    // ============================
    // Notification Preference DTOs
    // ============================

    public class NotificationPreferenceDto
    {
        public Guid Id { get; set; }
        public string UserId { get; set; }
        public bool EnablePush { get; set; }
        public bool ReservationNotifications { get; set; }
        public bool GPSAlerts { get; set; }
        public bool MaintenanceAlerts { get; set; }
        public bool SystemNotifications { get; set; }
        public bool SecurityAlerts { get; set; }
        public bool FleetAlerts { get; set; }
        public bool ExpenseNotifications { get; set; }
        public bool InvoiceNotifications { get; set; }
        public bool TicketNotifications { get; set; }
        public bool CriticalOnly { get; set; }
        public bool EnableQuietHours { get; set; }
        public TimeSpan? QuietHoursStart { get; set; }
        public TimeSpan? QuietHoursEnd { get; set; }
        public bool EnableSound { get; set; }
        public bool EnableVibration { get; set; }
        public bool ShowPreview { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class UpdateNotificationPreferenceDto
    {
        public bool? EnablePush { get; set; }
        public bool? ReservationNotifications { get; set; }
        public bool? GPSAlerts { get; set; }
        public bool? MaintenanceAlerts { get; set; }
        public bool? SystemNotifications { get; set; }
        public bool? SecurityAlerts { get; set; }
        public bool? FleetAlerts { get; set; }
        public bool? ExpenseNotifications { get; set; }
        public bool? InvoiceNotifications { get; set; }
        public bool? TicketNotifications { get; set; }
        public bool? CriticalOnly { get; set; }
        public bool? EnableQuietHours { get; set; }
        public TimeSpan? QuietHoursStart { get; set; }
        public TimeSpan? QuietHoursEnd { get; set; }
        public bool? EnableSound { get; set; }
        public bool? EnableVibration { get; set; }
        public bool? ShowPreview { get; set; }
    }

    // ============================
    // Query/Filter DTOs
    // ============================

    public class NotificationQueryDto
    {
        public bool? IsRead { get; set; }
        public NotificationType? Type { get; set; }
        public NotificationSeverity? Severity { get; set; }
        public Guid? AgencyId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class NotificationPagedResultDto
    {
        public List<NotificationDto> Items { get; set; }
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
