using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.DTOs.Notifications;
using React_Rentify.Server.Models.Notifications;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace React_Rentify.Server.Hubs
{
    /// <summary>
    /// SignalR Hub for real-time notification delivery
    /// Handles connection management, role-based routing, and notification broadcasting
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        private readonly MainDbContext _context;
        private readonly ILogger<NotificationHub> _logger;

        // Track active connections: UserId -> List of ConnectionIds
        private static readonly ConcurrentDictionary<string, HashSet<string>> _userConnections = new();

        public NotificationHub(MainDbContext context, ILogger<NotificationHub> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Called when a client connects
        /// </summary>
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("Connection attempt without valid user ID");
                Context.Abort();
                return;
            }

            var connectionId = Context.ConnectionId;

            // Add connection to tracking
            _userConnections.AddOrUpdate(
                userId,
                new HashSet<string> { connectionId },
                (key, existing) =>
                {
                    existing.Add(connectionId);
                    return existing;
                }
            );

            // Get user details and role
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("User {UserId} not found", userId);
                Context.Abort();
                return;
            }

            // Add to user-specific group
            await Groups.AddToGroupAsync(connectionId, $"user:{userId}");

            // Add to role-based group
            var role = user.Role.ToString();
            await Groups.AddToGroupAsync(connectionId, $"role:{role}");

            // Add to agency group if applicable
            if (user.AgencyId.HasValue)
            {
                await Groups.AddToGroupAsync(connectionId, $"agency:{user.AgencyId.Value}");
            }

            _logger.LogInformation("User {UserId} ({Role}) connected with ConnectionId {ConnectionId}",
                userId, role, connectionId);

            // Send unread count on connection
            var unreadCount = await GetUnreadCountForUser(userId);
            await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);

            await base.OnConnectedAsync();
        }

        /// <summary>
        /// Called when a client disconnects
        /// </summary>
        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var connectionId = Context.ConnectionId;

            if (!string.IsNullOrEmpty(userId))
            {
                // Remove connection from tracking
                if (_userConnections.TryGetValue(userId, out var connections))
                {
                    connections.Remove(connectionId);
                    if (connections.Count == 0)
                    {
                        _userConnections.TryRemove(userId, out _);
                    }
                }

                _logger.LogInformation("User {UserId} disconnected (ConnectionId: {ConnectionId})",
                    userId, connectionId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        // ============================
        // Client-to-Server Methods
        // ============================

        /// <summary>
        /// Mark a notification as read
        /// </summary>
        public async Task MarkAsRead(Guid notificationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return;

            var notification = await _context.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null && !notification.IsRead)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Send updated unread count
                var unreadCount = await GetUnreadCountForUser(userId);
                await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);

                _logger.LogInformation("Notification {NotificationId} marked as read by User {UserId}",
                    notificationId, userId);
            }
        }

        /// <summary>
        /// Mark all notifications as read
        /// </summary>
        public async Task MarkAllAsRead()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return;

            var unreadNotifications = await _context.Set<Notification>()
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Send updated unread count (should be 0)
            await Clients.Caller.SendAsync("UnreadCountUpdated", 0);

            _logger.LogInformation("User {UserId} marked {Count} notifications as read",
                userId, unreadNotifications.Count);
        }

        /// <summary>
        /// Delete a notification
        /// </summary>
        public async Task DeleteNotification(Guid notificationId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return;

            var notification = await _context.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification != null)
            {
                _context.Set<Notification>().Remove(notification);
                await _context.SaveChangesAsync();

                // Send updated unread count
                var unreadCount = await GetUnreadCountForUser(userId);
                await Clients.Caller.SendAsync("UnreadCountUpdated", unreadCount);
                await Clients.Caller.SendAsync("NotificationDeleted", notificationId);

                _logger.LogInformation("Notification {NotificationId} deleted by User {UserId}",
                    notificationId, userId);
            }
        }

        /// <summary>
        /// Get current unread count
        /// </summary>
        public async Task<int> GetUnreadCount()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId)) return 0;

            return await GetUnreadCountForUser(userId);
        }

        // ============================
        // Server-to-Client Methods (called from NotificationService)
        // ============================

        /// <summary>
        /// Send notification to specific user
        /// </summary>
        public async Task SendToUser(string userId, NotificationDto notification)
        {
            await Clients.Group($"user:{userId}").SendAsync("ReceiveNotification", notification);

            // Update unread count
            var unreadCount = await GetUnreadCountForUser(userId);
            await Clients.Group($"user:{userId}").SendAsync("UnreadCountUpdated", unreadCount);
        }

        /// <summary>
        /// Send notification to all users in an agency
        /// </summary>
        public async Task SendToAgency(Guid agencyId, NotificationDto notification)
        {
            await Clients.Group($"agency:{agencyId}").SendAsync("ReceiveNotification", notification);
        }

        /// <summary>
        /// Send notification to all users with a specific role
        /// </summary>
        public async Task SendToRole(string role, NotificationDto notification)
        {
            await Clients.Group($"role:{role}").SendAsync("ReceiveNotification", notification);
        }

        /// <summary>
        /// Broadcast notification to all connected clients
        /// </summary>
        public async Task BroadcastToAll(NotificationDto notification)
        {
            await Clients.All.SendAsync("ReceiveNotification", notification);
        }

        // ============================
        // Helper Methods
        // ============================

        /// <summary>
        /// Check if a user is currently online
        /// </summary>
        public static bool IsUserOnline(string userId)
        {
            return _userConnections.ContainsKey(userId) && _userConnections[userId].Count > 0;
        }

        /// <summary>
        /// Get all active connection IDs for a user
        /// </summary>
        public static HashSet<string> GetUserConnections(string userId)
        {
            return _userConnections.TryGetValue(userId, out var connections)
                ? new HashSet<string>(connections)
                : new HashSet<string>();
        }

        /// <summary>
        /// Get count of online users
        /// </summary>
        public static int GetOnlineUserCount()
        {
            return _userConnections.Count;
        }

        private async Task<int> GetUnreadCountForUser(string userId)
        {
            return await _context.Set<Notification>()
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }


        /// <summary>
        /// Client sends heartbeat to keep connection alive
        /// </summary>
        public async Task Heartbeat()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            _logger.LogDebug("Heartbeat received from user {UserId}", userId ?? "Unknown");
            await Clients.Caller.SendAsync("HeartbeatAck", DateTime.UtcNow);
        }
        /// <summary>
        /// Gets the current user's agency ID from the context
        /// </summary>
        private string? GetCurrentUserAgencyId()
        {
            return Context.User?.FindFirst("agencyId")?.Value;
        }
    }
}