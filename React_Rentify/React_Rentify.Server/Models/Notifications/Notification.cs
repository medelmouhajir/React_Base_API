using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Notifications
{
    /// <summary>
    /// Represents a notification sent to a user
    /// </summary>
    public class Notification
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// User who receives this notification
        /// </summary>
        [Required]
        public string UserId { get; set; }

        /// <summary>
        /// Agency related to this notification (null for system-wide admin notifications)
        /// </summary>
        public Guid? AgencyId { get; set; }

        /// <summary>
        /// Type of notification
        /// </summary>
        [Required]
        public NotificationType Type { get; set; }

        /// <summary>
        /// Severity level determines visual presentation and sound
        /// </summary>
        [Required]
        public NotificationSeverity Severity { get; set; }

        /// <summary>
        /// Notification title (short summary)
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        /// <summary>
        /// Notification message content
        /// </summary>
        [Required]
        [MaxLength(1000)]
        public string Message { get; set; }

        /// <summary>
        /// Additional context data stored as JSON
        /// Example: { "reservationId": "guid", "carPlate": "ABC-123", "location": {...} }
        /// </summary>
        [Column(TypeName = "jsonb")]
        public string? Data { get; set; }

        /// <summary>
        /// URL to navigate when notification is clicked
        /// Example: "/reservations/guid" or "/gps/cars"
        /// </summary>
        [MaxLength(500)]
        public string? ActionUrl { get; set; }

        /// <summary>
        /// Entity ID related to this notification (reservation, car, alert, etc.)
        /// Used for deduplication
        /// </summary>
        public Guid? EntityId { get; set; }

        /// <summary>
        /// Icon identifier for UI rendering
        /// Example: "warning", "car", "maintenance", "security"
        /// </summary>
        [MaxLength(50)]
        public string? Icon { get; set; }

        /// <summary>
        /// Whether the notification has been read
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// When the notification was read
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// When the notification was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Optional expiration time for temporary alerts
        /// After this time, notifications can be auto-deleted
        /// </summary>
        public DateTime? ExpiresAt { get; set; }

        /// <summary>
        /// Whether the notification has been sent via push
        /// </summary>
        public bool IsPushSent { get; set; } = false;

        /// <summary>
        /// When the push notification was sent
        /// </summary>
        public DateTime? PushSentAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }

    /// <summary>
    /// Types of notifications in the system
    /// </summary>
    public enum NotificationType
    {
        Reservation = 1,
        GPS = 2,
        Maintenance = 3,
        System = 4,
        Security = 5,
        Fleet = 6,
        Expense = 7,
        Invoice = 8,
        Ticket = 9
    }

    /// <summary>
    /// Severity levels for notifications
    /// </summary>
    public enum NotificationSeverity
    {
        /// <summary>
        /// Informational notification (blue) - soft sound, auto-dismiss
        /// </summary>
        Info = 1,

        /// <summary>
        /// Warning notification (yellow) - standard sound, stays visible
        /// </summary>
        Warning = 2,

        /// <summary>
        /// Critical notification (red) - urgent sound, requires acknowledgment
        /// </summary>
        Critical = 3
    }
}