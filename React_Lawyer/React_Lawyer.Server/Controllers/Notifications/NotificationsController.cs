using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Notifications;
using System.Net;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(ApplicationDbContext context, ILogger<NotificationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all notifications ordered by creation date (newest first)
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<Notification>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications()
        {
            try
            {
                var notifications = await _context.Notifications
                    .AsNoTracking()
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} notifications", notifications.Count);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving all notifications");
                return StatusCode(500, new { message = "Internal server error retrieving notifications" });
            }
        }

        /// <summary>
        /// Get a specific notification by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(Notification), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<Notification>> GetNotification(int id)
        {
            try
            {
                var notification = await _context.Notifications
                    .AsNoTracking()
                    .FirstOrDefaultAsync(n => n.NotificationId == id);

                if (notification == null)
                {
                    _logger.LogWarning("Notification with ID {Id} not found", id);
                    return NotFound(new { message = $"Notification with ID {id} not found" });
                }

                _logger.LogInformation("Retrieved notification with ID {Id}", id);
                return Ok(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification with ID {Id}", id);
                return StatusCode(500, new { message = $"Internal server error retrieving notification with ID {id}" });
            }
        }

        /// <summary>
        /// Get notifications for a specific user ordered by creation date (newest first)
        /// </summary>
        [HttpGet("User/{userId}")]
        [ProducesResponseType(typeof(IEnumerable<Notification>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotifications(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .AsNoTracking()
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} notifications for user {UserId}", notifications.Count, userId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications for user {UserId}", userId);
                return StatusCode(500, new { message = $"Internal server error retrieving notifications for user {userId}" });
            }
        }

        /// <summary>
        /// Get unread notifications for a specific user ordered by creation date (newest first)
        /// </summary>
        [HttpGet("User/{userId}/Unread")]
        [ProducesResponseType(typeof(IEnumerable<Notification>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserUnreadNotifications(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .AsNoTracking()
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} unread notifications for user {UserId}", notifications.Count, userId);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unread notifications for user {UserId}", userId);
                return StatusCode(500, new { message = $"Internal server error retrieving unread notifications for user {userId}" });
            }
        }

        /// <summary>
        /// Create a new notification
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(Notification), (int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<Notification>> CreateNotification(Notification notification)
        {
            try
            {
                if (notification == null)
                {
                    return BadRequest(new { message = "Notification data is required" });
                }

                // Set default values for new notifications
                notification.CreatedAt = DateTime.UtcNow;
                notification.IsRead = false;
                notification.ReadAt = null;

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created notification with ID {Id} for user {UserId}", notification.NotificationId, notification.UserId);

                return CreatedAtAction(
                    nameof(GetNotification),
                    new { id = notification.NotificationId },
                    notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, new { message = "Internal server error creating notification" });
            }
        }

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        [HttpPut("{id}/MarkAsRead")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    _logger.LogWarning("Cannot mark as read: Notification with ID {Id} not found", id);
                    return NotFound(new { message = $"Notification with ID {id} not found" });
                }

                // Only update if not already read
                if (!notification.IsRead)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;

                    _context.Entry(notification).State = EntityState.Modified;
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("Marked notification {Id} as read", id);
                }
                else
                {
                    _logger.LogInformation("Notification {Id} was already marked as read", id);
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {Id} as read", id);
                return StatusCode(500, new { message = $"Internal server error marking notification {id} as read" });
            }
        }

        /// <summary>
        /// Mark all notifications as read for a user
        /// </summary>
        [HttpPut("MarkAllAsRead/{userId}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> MarkAllAsRead(int userId)
        {
            try
            {
                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                if (!unreadNotifications.Any())
                {
                    _logger.LogInformation("No unread notifications found for user {UserId}", userId);
                    return NoContent();
                }

                var now = DateTime.UtcNow;
                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = now;
                    _context.Entry(notification).State = EntityState.Modified;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Marked {Count} notifications as read for user {UserId}", unreadNotifications.Count, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read for user {UserId}", userId);
                return StatusCode(500, new { message = $"Internal server error marking all notifications as read for user {userId}" });
            }
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.NotFound)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var notification = await _context.Notifications.FindAsync(id);
                if (notification == null)
                {
                    _logger.LogWarning("Cannot delete: Notification with ID {Id} not found", id);
                    return NotFound(new { message = $"Notification with ID {id} not found" });
                }

                _context.Notifications.Remove(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted notification with ID {Id}", id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification with ID {Id}", id);
                return StatusCode(500, new { message = $"Internal server error deleting notification with ID {id}" });
            }
        }

        /// <summary>
        /// Delete all notifications for a user
        /// </summary>
        [HttpDelete("DeleteAll/{userId}")]
        [ProducesResponseType((int)HttpStatusCode.NoContent)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<IActionResult> DeleteAllNotifications(int userId)
        {
            try
            {
                var notifications = await _context.Notifications
                    .Where(n => n.UserId == userId)
                    .ToListAsync();

                if (!notifications.Any())
                {
                    _logger.LogInformation("No notifications found to delete for user {UserId}", userId);
                    return NoContent();
                }

                _context.Notifications.RemoveRange(notifications);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Deleted {Count} notifications for user {UserId}", notifications.Count, userId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting all notifications for user {UserId}", userId);
                return StatusCode(500, new { message = $"Internal server error deleting all notifications for user {userId}" });
            }
        }

        /// <summary>
        /// Get notification summary for a user (unread count and recent notifications)
        /// </summary>
        [HttpGet("Summary/{userId}")]
        [ProducesResponseType(typeof(NotificationSummary), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<NotificationSummary>> GetNotificationSummary(int userId)
        {
            try
            {
                // Get unread count with a dedicated query
                var unreadCount = await _context.Notifications
                    .AsNoTracking()
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .CountAsync();

                // Get recent notifications
                var recentNotifications = await _context.Notifications
                    .AsNoTracking()
                    .Where(n => n.UserId == userId)
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(5)
                    .ToListAsync();

                var summary = new NotificationSummary
                {
                    UnreadCount = unreadCount,
                    RecentNotifications = recentNotifications
                };

                _logger.LogInformation("Retrieved notification summary for user {UserId}: {UnreadCount} unread, {RecentCount} recent",
                    userId, summary.UnreadCount, summary.RecentNotifications.Count());

                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification summary for user {UserId}", userId);
                return StatusCode(500, new { message = $"Internal server error retrieving notification summary for user {userId}" });
            }
        }

        /// <summary>
        /// Get notifications by type for a specific user
        /// </summary>
        [HttpGet("User/{userId}/ByType/{type}")]
        [ProducesResponseType(typeof(IEnumerable<Notification>), (int)HttpStatusCode.OK)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUserNotificationsByType(int userId, string type)
        {
            try
            {
                if (!Enum.TryParse<NotificationType>(type, true, out var notificationType))
                {
                    return BadRequest(new { message = $"Invalid notification type: {type}" });
                }

                var notifications = await _context.Notifications
                    .AsNoTracking()
                    .Where(n => n.UserId == userId && n.Type == notificationType)
                    .OrderByDescending(n => n.CreatedAt)
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} notifications of type {Type} for user {UserId}",
                    notifications.Count, type, userId);

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notifications of type {Type} for user {UserId}", type, userId);
                return StatusCode(500, new { message = $"Internal server error retrieving notifications of type {type} for user {userId}" });
            }
        }

        /// <summary>
        /// Batch create multiple notifications
        /// </summary>
        [HttpPost("Batch")]
        [ProducesResponseType((int)HttpStatusCode.Created)]
        [ProducesResponseType((int)HttpStatusCode.BadRequest)]
        [ProducesResponseType((int)HttpStatusCode.InternalServerError)]
        public async Task<ActionResult> CreateBatchNotifications(List<Notification> notifications)
        {
            try
            {
                if (notifications == null || !notifications.Any())
                {
                    return BadRequest(new { message = "At least one notification is required" });
                }

                var now = DateTime.UtcNow;
                foreach (var notification in notifications)
                {
                    notification.CreatedAt = now;
                    notification.IsRead = false;
                    notification.ReadAt = null;
                    _context.Notifications.Add(notification);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Created {Count} notifications in batch", notifications.Count);
                return StatusCode(201, new { message = $"Successfully created {notifications.Count} notifications" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating batch notifications");
                return StatusCode(500, new { message = "Internal server error creating batch notifications" });
            }
        }
    }

    public class NotificationSummary
    {
        public int UnreadCount { get; set; }
        public IEnumerable<Notification> RecentNotifications { get; set; }
    }
}