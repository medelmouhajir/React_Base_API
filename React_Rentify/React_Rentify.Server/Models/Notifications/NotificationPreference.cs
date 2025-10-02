using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Notifications
{
    /// <summary>
    /// User preferences for notification delivery and filtering
    /// One preference record per user
    /// </summary>
    public class NotificationPreference
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// User who owns these preferences
        /// </summary>
        [Required]
        public string UserId { get; set; }

        /// <summary>
        /// Master switch - enable/disable all push notifications
        /// </summary>
        public bool EnablePush { get; set; } = true;

        /// <summary>
        /// Receive reservation-related notifications
        /// (pending approvals, overdue returns, pickup/return reminders)
        /// </summary>
        public bool ReservationNotifications { get; set; } = true;

        /// <summary>
        /// Receive GPS and location alerts
        /// (geofence violations, speed alerts, unauthorized movement)
        /// </summary>
        public bool GPSAlerts { get; set; } = true;

        /// <summary>
        /// Receive maintenance alerts
        /// (service due, overdue, mileage thresholds)
        /// </summary>
        public bool MaintenanceAlerts { get; set; } = true;

        /// <summary>
        /// Receive system notifications
        /// (low fleet availability, subscription expiring)
        /// </summary>
        public bool SystemNotifications { get; set; } = true;

        /// <summary>
        /// Receive security alerts
        /// (failed login attempts, suspicious activity)
        /// </summary>
        public bool SecurityAlerts { get; set; } = true;

        /// <summary>
        /// Receive fleet management alerts
        /// (availability warnings, car status changes)
        /// </summary>
        public bool FleetAlerts { get; set; } = true;

        /// <summary>
        /// Receive expense notifications
        /// (new expenses requiring approval)
        /// </summary>
        public bool ExpenseNotifications { get; set; } = true;

        /// <summary>
        /// Receive invoice notifications
        /// (invoices generated, sent, paid)
        /// </summary>
        public bool InvoiceNotifications { get; set; } = true;

        /// <summary>
        /// Receive ticket notifications
        /// (tickets assigned to you, status updates)
        /// </summary>
        public bool TicketNotifications { get; set; } = true;

        /// <summary>
        /// Only receive critical severity notifications
        /// When enabled, filters out Info and Warning notifications
        /// </summary>
        public bool CriticalOnly { get; set; } = false;

        /// <summary>
        /// Enable quiet hours mode
        /// </summary>
        public bool EnableQuietHours { get; set; } = false;

        /// <summary>
        /// Start of quiet hours (time of day)
        /// Example: 22:00 (10 PM)
        /// During quiet hours, only Critical notifications are delivered
        /// </summary>
        public TimeSpan? QuietHoursStart { get; set; }

        /// <summary>
        /// End of quiet hours (time of day)
        /// Example: 08:00 (8 AM)
        /// </summary>
        public TimeSpan? QuietHoursEnd { get; set; }

        /// <summary>
        /// Enable notification sound
        /// </summary>
        public bool EnableSound { get; set; } = true;

        /// <summary>
        /// Enable vibration for mobile devices
        /// </summary>
        public bool EnableVibration { get; set; } = true;

        /// <summary>
        /// Show notification previews on lock screen
        /// </summary>
        public bool ShowPreview { get; set; } = true;

        /// <summary>
        /// When these preferences were created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time preferences were updated
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}