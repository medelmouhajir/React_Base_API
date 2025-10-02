using React_Rentify.Server.DTOs.Notifications;
using React_Rentify.Server.Models.Notifications;

namespace React_Rentify.Server.Services
{
    /// <summary>
    /// Service interface for managing notifications
    /// </summary>
    public interface INotificationService
    {
        // ============================
        // Core Notification Operations
        // ============================

        /// <summary>
        /// Creates a new notification and sends it to the user
        /// </summary>
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);

        /// <summary>
        /// Creates a notification from a template
        /// </summary>
        Task<NotificationDto> CreateFromTemplateAsync(NotificationTemplate template, string userId, Guid? agencyId, Guid? entityId = null, object? data = null);

        /// <summary>
        /// Creates and broadcasts notification to multiple users
        /// </summary>
        Task<List<NotificationDto>> CreateBulkNotificationsAsync(List<CreateNotificationDto> notifications);

        /// <summary>
        /// Gets a notification by ID
        /// </summary>
        Task<NotificationDto?> GetNotificationByIdAsync(Guid id);

        /// <summary>
        /// Gets paginated notifications for a user with optional filters
        /// </summary>
        Task<NotificationPagedResultDto> GetUserNotificationsAsync(string userId, NotificationQueryDto query);

        /// <summary>
        /// Gets notification summary for a user
        /// </summary>
        Task<NotificationSummaryDto> GetNotificationSummaryAsync(string userId);

        /// <summary>
        /// Gets unread notification count for a user
        /// </summary>
        Task<int> GetUnreadCountAsync(string userId);

        /// <summary>
        /// Marks a notification as read
        /// </summary>
        Task<bool> MarkAsReadAsync(Guid notificationId, string userId);

        /// <summary>
        /// Marks multiple notifications as read
        /// </summary>
        Task<int> MarkMultipleAsReadAsync(List<Guid> notificationIds, string userId);

        /// <summary>
        /// Marks all notifications as read for a user
        /// </summary>
        Task<int> MarkAllAsReadAsync(string userId);

        /// <summary>
        /// Deletes a notification
        /// </summary>
        Task<bool> DeleteNotificationAsync(Guid notificationId, string userId);

        /// <summary>
        /// Deletes multiple notifications
        /// </summary>
        Task<int> DeleteMultipleNotificationsAsync(List<Guid> notificationIds, string userId);

        // ============================
        // Role-Based Broadcasting
        // ============================

        /// <summary>
        /// Sends notification to all users in a specific agency
        /// </summary>
        Task BroadcastToAgencyAsync(Guid agencyId, NotificationTemplate template, Guid? entityId = null, object? data = null);

        /// <summary>
        /// Sends notification to all admins
        /// </summary>
        Task BroadcastToAdminsAsync(NotificationTemplate template, Guid? entityId = null, object? data = null);

        /// <summary>
        /// Sends notification to agency managers and admins
        /// </summary>
        Task BroadcastToManagersAndAdminsAsync(Guid agencyId, NotificationTemplate template, Guid? entityId = null, object? data = null);

        // ============================
        // Deduplication & Cleanup
        // ============================

        /// <summary>
        /// Checks if a similar notification already exists (deduplication)
        /// </summary>
        Task<bool> NotificationExistsAsync(string userId, NotificationType type, Guid? entityId, TimeSpan withinPeriod);

        /// <summary>
        /// Deletes expired notifications
        /// </summary>
        Task<int> CleanupExpiredNotificationsAsync();

        /// <summary>
        /// Deletes old read notifications
        /// </summary>
        Task<int> CleanupOldReadNotificationsAsync(int daysOld = 30);

        // ============================
        // Push Subscription Management
        // ============================

        /// <summary>
        /// Subscribes user to push notifications
        /// </summary>
        Task<PushSubscriptionDto> SubscribeToPushAsync(string userId, CreatePushSubscriptionDto dto);

        /// <summary>
        /// Unsubscribes from push notifications by endpoint
        /// </summary>
        Task<bool> UnsubscribeFromPushAsync(string userId, string endpoint);

        /// <summary>
        /// Gets all push subscriptions for a user
        /// </summary>
        Task<List<PushSubscriptionDto>> GetUserPushSubscriptionsAsync(string userId);

        /// <summary>
        /// Cleans up failed push subscriptions
        /// </summary>
        Task<int> CleanupFailedPushSubscriptionsAsync(int maxFailures = 5);

        // ============================
        // User Preferences
        // ============================

        /// <summary>
        /// Gets user notification preferences
        /// </summary>
        Task<NotificationPreferenceDto> GetUserPreferencesAsync(string userId);

        /// <summary>
        /// Updates user notification preferences
        /// </summary>
        Task<NotificationPreferenceDto> UpdateUserPreferencesAsync(string userId, UpdateNotificationPreferenceDto dto);

        /// <summary>
        /// Checks if user should receive a notification based on preferences
        /// </summary>
        Task<bool> ShouldSendNotificationAsync(string userId, NotificationType type, NotificationSeverity severity);

        // ============================
        // Real-time Delivery
        // ============================

        /// <summary>
        /// Sends notification via SignalR to connected users
        /// </summary>
        Task SendRealtimeNotificationAsync(NotificationDto notification);

        /// <summary>
        /// Sends notification via Web Push (for offline users)
        /// </summary>
        Task SendPushNotificationAsync(NotificationDto notification);
    }
}