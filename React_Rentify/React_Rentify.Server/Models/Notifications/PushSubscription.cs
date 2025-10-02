using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Models.Notifications
{
    /// <summary>
    /// Stores Web Push subscription information for users
    /// Each user can have multiple subscriptions (different devices/browsers)
    /// </summary>
    public class PushSubscription
    {
        [Key]
        public Guid Id { get; set; }

        /// <summary>
        /// User who owns this push subscription
        /// </summary>
        [Required]
        public string UserId { get; set; }

        /// <summary>
        /// Unique push endpoint URL from the browser
        /// </summary>
        [Required]
        [MaxLength(500)]
        public string Endpoint { get; set; }

        /// <summary>
        /// P256DH public key for encryption
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string P256dh { get; set; }

        /// <summary>
        /// Auth secret for encryption
        /// </summary>
        [Required]
        [MaxLength(200)]
        public string Auth { get; set; }

        /// <summary>
        /// Device/browser identifier (optional, for user management)
        /// Example: "Chrome on Windows", "Safari on iPhone"
        /// </summary>
        [MaxLength(100)]
        public string? DeviceInfo { get; set; }

        /// <summary>
        /// When this subscription was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last time a notification was successfully sent to this subscription
        /// </summary>
        public DateTime? LastUsedAt { get; set; }

        /// <summary>
        /// Whether this subscription is still active
        /// Set to false if push fails (expired/unsubscribed)
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Number of consecutive failures (for cleanup)
        /// </summary>
        public int FailureCount { get; set; } = 0;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public virtual User? User { get; set; }
    }
}