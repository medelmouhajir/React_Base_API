using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using React_Rentify.Server.DTOs.Notifications;
using React_Rentify.Server.Models.Notifications;
using React_Rentify.Server.Services;
using System.Security.Claims;

namespace React_Rentify.Server.Controllers.App
{
    /// <summary>
    /// API controller for managing notifications
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            INotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/notifications
        /// Gets paginated notifications for the current user with optional filters
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetNotifications([FromQuery] NotificationQueryDto query)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} retrieving notifications", userId);

            var result = await _notificationService.GetUserNotificationsAsync(userId, query);
            return Ok(result);
        }

        /// <summary>
        /// GET: api/notifications/{id}
        /// Gets a specific notification by ID
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetNotification(Guid id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} retrieving notification {NotificationId}", userId, id);

            var notification = await _notificationService.GetNotificationByIdAsync(id);

            if (notification == null)
                return NotFound(new { message = "Notification not found" });

            if (notification.UserId != userId)
                return Forbid();

            return Ok(notification);
        }

        /// <summary>
        /// GET: api/notifications/summary
        /// Gets notification summary for the current user
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetNotificationSummary()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} retrieving notification summary", userId);

            var summary = await _notificationService.GetNotificationSummaryAsync(userId);
            return Ok(summary);
        }

        /// <summary>
        /// GET: api/notifications/unread-count
        /// Gets unread notification count for the current user
        /// </summary>
        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var count = await _notificationService.GetUnreadCountAsync(userId);
            return Ok(new { unreadCount = count });
        }

        /// <summary>
        /// POST: api/notifications/{id}/read
        /// Marks a notification as read
        /// </summary>
        [HttpPost("{id:guid}/read")]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} marking notification {NotificationId} as read", userId, id);

            var success = await _notificationService.MarkAsReadAsync(id, userId);

            if (!success)
                return NotFound(new { message = "Notification not found or already read" });

            return Ok(new { message = "Notification marked as read" });
        }

        /// <summary>
        /// POST: api/notifications/mark-read
        /// Marks multiple notifications as read
        /// </summary>
        [HttpPost("mark-read")]
        public async Task<IActionResult> MarkMultipleAsRead([FromBody] MarkNotificationsReadDto dto)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("User {UserId} marking {Count} notifications as read", userId, dto.NotificationIds.Count);

            var count = await _notificationService.MarkMultipleAsReadAsync(dto.NotificationIds, userId);
            return Ok(new { message = $"{count} notifications marked as read", count });
        }

        /// <summary>
        /// POST: api/notifications/mark-all-read
        /// Marks all notifications as read for the current user
        /// </summary>
        [HttpPost("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} marking all notifications as read", userId);

            var count = await _notificationService.MarkAllAsReadAsync(userId);
            return Ok(new { message = $"All {count} notifications marked as read", count });
        }

        /// <summary>
        /// DELETE: api/notifications/{id}
        /// Deletes a notification
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteNotification(Guid id)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} deleting notification {NotificationId}", userId, id);

            var success = await _notificationService.DeleteNotificationAsync(id, userId);

            if (!success)
                return NotFound(new { message = "Notification not found" });

            return Ok(new { message = "Notification deleted" });
        }

        /// <summary>
        /// DELETE: api/notifications/bulk
        /// Deletes multiple notifications
        /// </summary>
        [HttpDelete("bulk")]
        public async Task<IActionResult> DeleteMultipleNotifications([FromBody] List<Guid> notificationIds)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} deleting {Count} notifications", userId, notificationIds.Count);

            var count = await _notificationService.DeleteMultipleNotificationsAsync(notificationIds, userId);
            return Ok(new { message = $"{count} notifications deleted", count });
        }

        // ============================
        // Push Subscription Endpoints
        // ============================

        /// <summary>
        /// POST: api/notifications/subscribe
        /// Subscribes to push notifications
        /// </summary>
        [HttpPost("subscribe")]
        public async Task<IActionResult> SubscribeToPush([FromBody] CreatePushSubscriptionDto dto)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("User {UserId} subscribing to push notifications", userId);

            var subscription = await _notificationService.SubscribeToPushAsync(userId, dto);
            return Ok(subscription);
        }

        /// <summary>
        /// DELETE: api/notifications/unsubscribe
        /// Unsubscribes from push notifications
        /// </summary>
        [HttpDelete("unsubscribe")]
        public async Task<IActionResult> UnsubscribeFromPush([FromBody] string endpoint)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} unsubscribing from push notifications", userId);

            var success = await _notificationService.UnsubscribeFromPushAsync(userId, endpoint);

            if (!success)
                return NotFound(new { message = "Subscription not found" });

            return Ok(new { message = "Unsubscribed from push notifications" });
        }

        /// <summary>
        /// GET: api/notifications/subscriptions
        /// Gets all push subscriptions for the current user
        /// </summary>
        [HttpGet("subscriptions")]
        public async Task<IActionResult> GetPushSubscriptions()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} retrieving push subscriptions", userId);

            var subscriptions = await _notificationService.GetUserPushSubscriptionsAsync(userId);
            return Ok(subscriptions);
        }

        // ============================
        // User Preference Endpoints
        // ============================

        /// <summary>
        /// GET: api/notifications/preferences
        /// Gets notification preferences for the current user
        /// </summary>
        [HttpGet("preferences")]
        public async Task<IActionResult> GetPreferences()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            _logger.LogInformation("User {UserId} retrieving notification preferences", userId);

            var preferences = await _notificationService.GetUserPreferencesAsync(userId);
            return Ok(preferences);
        }

        /// <summary>
        /// PUT: api/notifications/preferences
        /// Updates notification preferences for the current user
        /// </summary>
        [HttpPut("preferences")]
        public async Task<IActionResult> UpdatePreferences([FromBody] UpdateNotificationPreferenceDto dto)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("User {UserId} updating notification preferences", userId);

            var preferences = await _notificationService.UpdateUserPreferencesAsync(userId, dto);
            return Ok(preferences);
        }

        // ============================
        // Admin Endpoints
        // ============================

        /// <summary>
        /// POST: api/notifications/admin/create
        /// Creates a notification (Admin only)
        /// </summary>
        [HttpPost("admin/create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateNotification([FromBody] CreateNotificationDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Admin creating notification for user {UserId}", dto.UserId);

            var notification = await _notificationService.CreateNotificationAsync(dto);

            if (notification == null)
                return BadRequest(new { message = "Notification blocked by user preferences or duplicate detected" });

            return CreatedAtAction(nameof(GetNotification), new { id = notification.Id }, notification);
        }

        /// <summary>
        /// POST: api/notifications/admin/broadcast-agency
        /// Broadcasts notification to all users in an agency (Admin only)
        /// </summary>
        [HttpPost("admin/broadcast-agency")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> BroadcastToAgency([FromBody] BroadcastToAgencyDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            _logger.LogInformation("Admin broadcasting notification to agency {AgencyId}", dto.AgencyId);

            var template = new NotificationTemplate
            {
                Type = dto.Type,
                Severity = dto.Severity,
                Title = dto.Title,
                Message = dto.Message,
                Icon = dto.Icon,
                ActionUrl = dto.ActionUrl
            };

            await _notificationService.BroadcastToAgencyAsync(dto.AgencyId, template, dto.EntityId, dto.Data);

            return Ok(new { message = "Notification broadcast to agency" });
        }

        /// <summary>
        /// DELETE: api/notifications/admin/cleanup-expired
        /// Cleans up expired notifications (Admin only)
        /// </summary>
        [HttpDelete("admin/cleanup-expired")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CleanupExpired()
        {
            _logger.LogInformation("Admin cleaning up expired notifications");

            var count = await _notificationService.CleanupExpiredNotificationsAsync();
            return Ok(new { message = $"{count} expired notifications cleaned up", count });
        }

        /// <summary>
        /// DELETE: api/notifications/admin/cleanup-old
        /// Cleans up old read notifications (Admin only)
        /// </summary>
        [HttpDelete("admin/cleanup-old")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CleanupOld([FromQuery] int daysOld = 30)
        {
            _logger.LogInformation("Admin cleaning up old read notifications (older than {Days} days)", daysOld);

            var count = await _notificationService.CleanupOldReadNotificationsAsync(daysOld);
            return Ok(new { message = $"{count} old notifications cleaned up", count });
        }

        // ============================
        // Helper Methods
        // ============================

        private string? GetCurrentUserId()
        {
            return User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }

    // ============================
    // Additional DTOs
    // ============================

    public class BroadcastToAgencyDto
    {
        public Guid AgencyId { get; set; }
        public NotificationType Type { get; set; }
        public NotificationSeverity Severity { get; set; }
        public string Title { get; set; }
        public string Message { get; set; }
        public string? Icon { get; set; }
        public string? ActionUrl { get; set; }
        public Guid? EntityId { get; set; }
        public object? Data { get; set; }
    }
}