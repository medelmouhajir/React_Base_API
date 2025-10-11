using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.DTOs.Notifications;
using React_Rentify.Server.Hubs;
using React_Rentify.Server.Models.Notifications;
using React_Rentify.Server.Models.Users;
using System.Text.Json;

namespace React_Rentify.Server.Services
{
    /// <summary>
    /// Service for managing notifications with real-time delivery
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly MainDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            MainDbContext context,
            UserManager<User> userManager,
            IHubContext<NotificationHub> hubContext,
            ILogger<NotificationService> logger)
        {
            _context = context;
            _userManager = userManager;
            _hubContext = hubContext;
            _logger = logger;
        }

        // ============================
        // Core Notification Operations
        // ============================

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            _logger.LogInformation("Creating notification for user {UserId}, type {Type}", dto.UserId, dto.Type);

            // Check preferences before creating
            if (!await ShouldSendNotificationAsync(dto.UserId, dto.Type, dto.Severity))
            {
                _logger.LogInformation("Notification blocked by user preferences for {UserId}", dto.UserId);
                return null;
            }

            // Check for duplicates
            if (dto.EntityId.HasValue && await NotificationExistsAsync(dto.UserId, dto.Type, dto.EntityId, TimeSpan.FromMinutes(5)))
            {
                _logger.LogInformation("Duplicate notification blocked for user {UserId}, entity {EntityId}", dto.UserId, dto.EntityId);
                return null;
            }

            var notification = new Notification
            {
                Id = Guid.NewGuid(),
                UserId = dto.UserId,
                AgencyId = dto.AgencyId,
                Type = dto.Type,
                Severity = dto.Severity,
                Title = dto.Title,
                Message = dto.Message,
                Data = dto.Data != null ? JsonSerializer.Serialize(dto.Data) : null,
                ActionUrl = dto.ActionUrl,
                EntityId = dto.EntityId,
                Icon = dto.Icon,
                ExpiresAt = dto.ExpiresAt,
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            };

            _context.Set<Notification>().Add(notification);
            await _context.SaveChangesAsync();

            var notificationDto = MapToDto(notification);

            // Send real-time notification
            await SendRealtimeNotificationAsync(notificationDto);

            // Send push notification (non-blocking behavior handled within the method)
            try
            {
                await SendPushNotificationAsync(notificationDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push notification for {NotificationId}", notification.Id);
            }

            _logger.LogInformation("Notification {NotificationId} created successfully", notification.Id);
            return notificationDto;
        }

        public async Task<NotificationDto> CreateFromTemplateAsync(NotificationTemplate template, string userId, Guid? agencyId, Guid? entityId = null, object? data = null)
        {
            var dto = template.ToDto(userId, agencyId, entityId, data);
            return await CreateNotificationAsync(dto);
        }

        public async Task<List<NotificationDto>> CreateBulkNotificationsAsync(List<CreateNotificationDto> notifications)
        {
            _logger.LogInformation("Creating {Count} bulk notifications", notifications.Count);

            var results = new List<NotificationDto>();

            foreach (var dto in notifications)
            {
                var result = await CreateNotificationAsync(dto);
                if (result != null)
                {
                    results.Add(result);
                }
            }

            return results;
        }

        public async Task<NotificationDto?> GetNotificationByIdAsync(Guid id)
        {
            var notification = await _context.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == id);

            return notification != null ? MapToDto(notification) : null;
        }

        public async Task<NotificationPagedResultDto> GetUserNotificationsAsync(string userId, NotificationQueryDto query)
        {
            var queryable = _context.Set<Notification>()
                .Where(n => n.UserId == userId)
                .AsQueryable();

            // Apply filters
            if (query.IsRead.HasValue)
                queryable = queryable.Where(n => n.IsRead == query.IsRead.Value);

            if (query.Type.HasValue)
                queryable = queryable.Where(n => n.Type == query.Type.Value);

            if (query.Severity.HasValue)
                queryable = queryable.Where(n => n.Severity == query.Severity.Value);

            if (query.AgencyId.HasValue)
                queryable = queryable.Where(n => n.AgencyId == query.AgencyId.Value);

            if (query.FromDate.HasValue)
                queryable = queryable.Where(n => n.CreatedAt >= query.FromDate.Value);

            if (query.ToDate.HasValue)
                queryable = queryable.Where(n => n.CreatedAt <= query.ToDate.Value);

            // Get total count
            var totalCount = await queryable.CountAsync();

            // Apply pagination
            var notifications = await queryable
                .OrderByDescending(n => n.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            return new NotificationPagedResultDto
            {
                Items = notifications.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = query.Page,
                PageSize = query.PageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)query.PageSize)
            };
        }

        public async Task<NotificationSummaryDto> GetNotificationSummaryAsync(string userId)
        {
            var notifications = await _context.Set<Notification>()
                .Where(n => n.UserId == userId)
                .ToListAsync();

            return new NotificationSummaryDto
            {
                TotalCount = notifications.Count,
                UnreadCount = notifications.Count(n => !n.IsRead),
                CriticalCount = notifications.Count(n => n.Severity == NotificationSeverity.Critical && !n.IsRead),
                WarningCount = notifications.Count(n => n.Severity == NotificationSeverity.Warning && !n.IsRead),
                InfoCount = notifications.Count(n => n.Severity == NotificationSeverity.Info && !n.IsRead),
                LastNotificationAt = notifications.Any() ? notifications.Max(n => n.CreatedAt) : (DateTime?)null
            };
        }

        public async Task<int> GetUnreadCountAsync(string userId)
        {
            return await _context.Set<Notification>()
                .CountAsync(n => n.UserId == userId && !n.IsRead);
        }

        public async Task<bool> MarkAsReadAsync(Guid notificationId, string userId)
        {
            var notification = await _context.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            // Notify via SignalR
            await _hubContext.Clients.User(userId).SendAsync("NotificationRead", notificationId);

            return true;
        }

        public async Task<int> MarkMultipleAsReadAsync(List<Guid> notificationIds, string userId)
        {
            var notifications = await _context.Set<Notification>()
                .Where(n => notificationIds.Contains(n.Id) && n.UserId == userId && !n.IsRead)
                .ToListAsync();

            var count = notifications.Count;
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Notify via SignalR
            await _hubContext.Clients.User(userId).SendAsync("BulkNotificationUpdate", notificationIds, true);

            return count;
        }

        public async Task<int> MarkAllAsReadAsync(string userId)
        {
            var notifications = await _context.Set<Notification>()
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            var count = notifications.Count;
            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                notification.ReadAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            // Notify via SignalR
            await _hubContext.Clients.User(userId).SendAsync("AllNotificationsMarkedRead");

            return count;
        }

        public async Task<bool> DeleteNotificationAsync(Guid notificationId, string userId)
        {
            var notification = await _context.Set<Notification>()
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                return false;

            _context.Set<Notification>().Remove(notification);
            await _context.SaveChangesAsync();

            // Notify via SignalR
            await _hubContext.Clients.User(userId).SendAsync("NotificationDeleted", notificationId);

            return true;
        }

        public async Task<int> DeleteMultipleNotificationsAsync(List<Guid> notificationIds, string userId)
        {
            var notifications = await _context.Set<Notification>()
                .Where(n => notificationIds.Contains(n.Id) && n.UserId == userId)
                .ToListAsync();

            var count = notifications.Count;
            _context.Set<Notification>().RemoveRange(notifications);
            await _context.SaveChangesAsync();

            return count;
        }

        // ============================
        // Role-Based Broadcasting
        // ============================

        public async Task BroadcastToAgencyAsync(Guid agencyId, NotificationTemplate template, Guid? entityId = null, object? data = null)
        {
            _logger.LogInformation("Broadcasting notification to agency {AgencyId}", agencyId);

            // Get all users in the agency (Owner, Manager)
            var users = await _userManager.Users
                .Where(u => u.AgencyId == agencyId && (u.Role == User_Role.Owner || u.Role == User_Role.Manager))
                .ToListAsync();

            var notifications = users.Select(u => template.ToDto(u.Id, agencyId, entityId, data)).ToList();
            await CreateBulkNotificationsAsync(notifications);
        }

        public async Task BroadcastToAdminsAsync(NotificationTemplate template, Guid? entityId = null, object? data = null)
        {
            _logger.LogInformation("Broadcasting notification to all admins");

            var admins = await _userManager.GetUsersInRoleAsync("Admin");
            var notifications = admins.Select(u => template.ToDto(u.Id, null, entityId, data)).ToList();
            await CreateBulkNotificationsAsync(notifications);
        }

        public async Task BroadcastToManagersAndAdminsAsync(Guid agencyId, NotificationTemplate template, Guid? entityId = null, object? data = null)
        {
            _logger.LogInformation("Broadcasting notification to managers of agency {AgencyId} and admins", agencyId);

            // Get agency managers
            var managers = await _userManager.Users
                .Where(u => u.AgencyId == agencyId && (u.Role == User_Role.Owner || u.Role == User_Role.Manager))
                .ToListAsync();

            // Get all admins
            var admins = await _userManager.GetUsersInRoleAsync("Admin");

            var allUsers = managers.Concat(admins).DistinctBy(u => u.Id).ToList();
            var notifications = allUsers.Select(u => template.ToDto(u.Id, agencyId, entityId, data)).ToList();
            await CreateBulkNotificationsAsync(notifications);
        }

        // ============================
        // Deduplication & Cleanup
        // ============================

        public async Task<bool> NotificationExistsAsync(string userId, NotificationType type, Guid? entityId, TimeSpan withinPeriod)
        {
            if (!entityId.HasValue)
                return false;

            var cutoffTime = DateTime.UtcNow.Subtract(withinPeriod);

            return await _context.Set<Notification>()
                .AnyAsync(n => n.UserId == userId
                            && n.Type == type
                            && n.EntityId == entityId
                            && n.CreatedAt >= cutoffTime);
        }

        public async Task<int> CleanupExpiredNotificationsAsync()
        {
            var expired = await _context.Set<Notification>()
                .Where(n => n.ExpiresAt.HasValue && n.ExpiresAt.Value < DateTime.UtcNow)
                .ToListAsync();

            _context.Set<Notification>().RemoveRange(expired);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} expired notifications", expired.Count);
            return expired.Count;
        }

        public async Task<int> CleanupOldReadNotificationsAsync(int daysOld = 30)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-daysOld);

            var old = await _context.Set<Notification>()
                .Where(n => n.IsRead && n.ReadAt.HasValue && n.ReadAt.Value < cutoffDate && n.Severity != NotificationSeverity.Critical)
                .ToListAsync();

            _context.Set<Notification>().RemoveRange(old);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} old read notifications", old.Count);
            return old.Count;
        }

        // ============================
        // Push Subscription Management
        // ============================

        public async Task<PushSubscriptionDto> SubscribeToPushAsync(string userId, CreatePushSubscriptionDto dto)
        {
            _logger.LogInformation("Subscribing user {UserId} to push notifications", userId);

            // Check if subscription already exists
            var existing = await _context.Set<PushSubscription>()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == dto.Endpoint);

            if (existing != null)
            {
                // Update existing subscription
                existing.P256dh = dto.P256dh;
                existing.Auth = dto.Auth;
                existing.DeviceInfo = dto.DeviceInfo;
                existing.IsActive = true;
                existing.FailureCount = 0;
                await _context.SaveChangesAsync();

                return MapToPushSubscriptionDto(existing);
            }

            var subscription = new PushSubscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Endpoint = dto.Endpoint,
                P256dh = dto.P256dh,
                Auth = dto.Auth,
                DeviceInfo = dto.DeviceInfo,
                CreatedAt = DateTime.UtcNow,
                IsActive = true
            };

            _context.Set<PushSubscription>().Add(subscription);
            await _context.SaveChangesAsync();

            return MapToPushSubscriptionDto(subscription);
        }

        public async Task<bool> UnsubscribeFromPushAsync(string userId, string endpoint)
        {
            var subscription = await _context.Set<PushSubscription>()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

            if (subscription == null)
                return false;

            _context.Set<PushSubscription>().Remove(subscription);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<List<PushSubscriptionDto>> GetUserPushSubscriptionsAsync(string userId)
        {
            var subscriptions = await _context.Set<PushSubscription>()
                .Where(s => s.UserId == userId && s.IsActive)
                .ToListAsync();

            return subscriptions.Select(MapToPushSubscriptionDto).ToList();
        }

        public async Task<int> CleanupFailedPushSubscriptionsAsync(int maxFailures = 5)
        {
            var failed = await _context.Set<PushSubscription>()
                .Where(s => s.FailureCount >= maxFailures || !s.IsActive)
                .ToListAsync();

            _context.Set<PushSubscription>().RemoveRange(failed);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Cleaned up {Count} failed push subscriptions", failed.Count);
            return failed.Count;
        }

        // ============================
        // User Preferences
        // ============================

        public async Task<NotificationPreferenceDto> GetUserPreferencesAsync(string userId)
        {
            var preference = await _context.Set<NotificationPreference>()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preference == null)
            {
                // Create default preferences
                preference = new NotificationPreference
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    EnablePush = true,
                    ReservationNotifications = true,
                    GPSAlerts = true,
                    MaintenanceAlerts = true,
                    SystemNotifications = true,
                    SecurityAlerts = true,
                    FleetAlerts = true,
                    ExpenseNotifications = true,
                    InvoiceNotifications = true,
                    TicketNotifications = true,
                    CriticalOnly = false,
                    EnableQuietHours = false,
                    EnableSound = true,
                    EnableVibration = true,
                    ShowPreview = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.Set<NotificationPreference>().Add(preference);
                await _context.SaveChangesAsync();
            }

            return MapToPreferenceDto(preference);
        }

        public async Task<NotificationPreferenceDto> UpdateUserPreferencesAsync(string userId, UpdateNotificationPreferenceDto dto)
        {
            var preference = await _context.Set<NotificationPreference>()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            if (preference == null)
            {
                preference = new NotificationPreference
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Set<NotificationPreference>().Add(preference);
            }

            // Update only provided fields
            if (dto.EnablePush.HasValue) preference.EnablePush = dto.EnablePush.Value;
            if (dto.ReservationNotifications.HasValue) preference.ReservationNotifications = dto.ReservationNotifications.Value;
            if (dto.GPSAlerts.HasValue) preference.GPSAlerts = dto.GPSAlerts.Value;
            if (dto.MaintenanceAlerts.HasValue) preference.MaintenanceAlerts = dto.MaintenanceAlerts.Value;
            if (dto.SystemNotifications.HasValue) preference.SystemNotifications = dto.SystemNotifications.Value;
            if (dto.SecurityAlerts.HasValue) preference.SecurityAlerts = dto.SecurityAlerts.Value;
            if (dto.FleetAlerts.HasValue) preference.FleetAlerts = dto.FleetAlerts.Value;
            if (dto.ExpenseNotifications.HasValue) preference.ExpenseNotifications = dto.ExpenseNotifications.Value;
            if (dto.InvoiceNotifications.HasValue) preference.InvoiceNotifications = dto.InvoiceNotifications.Value;
            if (dto.TicketNotifications.HasValue) preference.TicketNotifications = dto.TicketNotifications.Value;
            if (dto.CriticalOnly.HasValue) preference.CriticalOnly = dto.CriticalOnly.Value;
            if (dto.EnableQuietHours.HasValue) preference.EnableQuietHours = dto.EnableQuietHours.Value;
            if (dto.QuietHoursStart.HasValue) preference.QuietHoursStart = dto.QuietHoursStart.Value;
            if (dto.QuietHoursEnd.HasValue) preference.QuietHoursEnd = dto.QuietHoursEnd.Value;
            if (dto.EnableSound.HasValue) preference.EnableSound = dto.EnableSound.Value;
            if (dto.EnableVibration.HasValue) preference.EnableVibration = dto.EnableVibration.Value;
            if (dto.ShowPreview.HasValue) preference.ShowPreview = dto.ShowPreview.Value;

            preference.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return MapToPreferenceDto(preference);
        }

        public async Task<bool> ShouldSendNotificationAsync(string userId, NotificationType type, NotificationSeverity severity)
        {
            var preference = await _context.Set<NotificationPreference>()
                .FirstOrDefaultAsync(p => p.UserId == userId);

            // If no preferences, allow all notifications
            if (preference == null)
                return true;

            // Always allow critical security alerts
            if (severity == NotificationSeverity.Critical && type == NotificationType.Security)
                return true;

            // Check if push is enabled
            if (!preference.EnablePush)
                return false;

            // Check if critical only mode is enabled
            if (preference.CriticalOnly && severity != NotificationSeverity.Critical)
                return false;

            // Check quiet hours
            if (preference.EnableQuietHours && preference.QuietHoursStart.HasValue && preference.QuietHoursEnd.HasValue)
            {
                var now = DateTime.UtcNow.TimeOfDay;
                var start = preference.QuietHoursStart.Value;
                var end = preference.QuietHoursEnd.Value;

                bool inQuietHours;
                if (start < end)
                {
                    inQuietHours = now >= start && now <= end;
                }
                else // Quiet hours cross midnight
                {
                    inQuietHours = now >= start || now <= end;
                }

                // Skip non-critical notifications during quiet hours
                if (inQuietHours && severity != NotificationSeverity.Critical)
                    return false;
            }

            // Check type-specific preferences
            return type switch
            {
                NotificationType.Reservation => preference.ReservationNotifications,
                NotificationType.GPS => preference.GPSAlerts,
                NotificationType.Maintenance => preference.MaintenanceAlerts,
                NotificationType.System => preference.SystemNotifications,
                NotificationType.Security => preference.SecurityAlerts,
                NotificationType.Fleet => preference.FleetAlerts,
                NotificationType.Expense => preference.ExpenseNotifications,
                NotificationType.Invoice => preference.InvoiceNotifications,
                NotificationType.Ticket => preference.TicketNotifications,
                _ => true
            };
        }

        // ============================
        // Real-time Delivery
        // ============================

        public async Task SendRealtimeNotificationAsync(NotificationDto notification)
        {
            try
            {
                // Send to specific user via SignalR
                await _hubContext.Clients.User(notification.UserId).SendAsync("ReceiveNotification", notification);
                _logger.LogInformation("Real-time notification sent to user {UserId}", notification.UserId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send real-time notification to user {UserId}", notification.UserId);
            }
        }

        public async Task SendPushNotificationAsync(NotificationDto notification)
        {
            try
            {
                var subscriptions = await _context.Set<PushSubscription>()
                    .Where(s => s.UserId == notification.UserId && s.IsActive)
                    .ToListAsync();

                if (!subscriptions.Any())
                {
                    _logger.LogDebug("No push subscriptions found for user {UserId}", notification.UserId);
                    return;
                }

                var payload = new PushNotificationPayloadDto
                {
                    Title = notification.Title,
                    Body = notification.Message,
                    Icon = notification.Icon ?? "/icons/notification.png",
                    Badge = "/icons/badge.png",
                    Tag = $"{notification.Type}-{notification.EntityId}",
                    Data = new
                    {
                        notificationId = notification.Id,
                        type = notification.Type.ToString(),
                        severity = notification.Severity.ToString(),
                        url = notification.ActionUrl,
                        createdAt = notification.CreatedAt
                    }
                };

                // TODO: Implement actual Web Push sending using WebPush library
                // This is a placeholder - you'll need to add WebPush NuGet package
                _logger.LogInformation("Push notification payload prepared for user {UserId}, {Count} subscriptions",
                    notification.UserId, subscriptions.Count);

                // Mark notification as pushed
                var notificationEntity = await _context.Set<Notification>()
                    .FirstOrDefaultAsync(n => n.Id == notification.Id);

                if (notificationEntity != null)
                {
                    notificationEntity.IsPushSent = true;
                    notificationEntity.PushSentAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send push notification for {NotificationId}", notification.Id);
            }
        }

        // ============================
        // Mapping Helpers
        // ============================

        private NotificationDto MapToDto(Notification notification)
        {
            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                AgencyId = notification.AgencyId,
                Type = notification.Type,
                TypeName = notification.Type.ToString(),
                Severity = notification.Severity,
                SeverityName = notification.Severity.ToString(),
                Title = notification.Title,
                Message = notification.Message,
                Data = !string.IsNullOrEmpty(notification.Data)
                    ? JsonSerializer.Deserialize<object>(notification.Data)
                    : null,
                ActionUrl = notification.ActionUrl,
                EntityId = notification.EntityId,
                Icon = notification.Icon,
                IsRead = notification.IsRead,
                ReadAt = notification.ReadAt,
                CreatedAt = notification.CreatedAt,
                ExpiresAt = notification.ExpiresAt
            };
        }

        private PushSubscriptionDto MapToPushSubscriptionDto(PushSubscription subscription)
        {
            return new PushSubscriptionDto
            {
                Id = subscription.Id,
                UserId = subscription.UserId,
                Endpoint = subscription.Endpoint,
                DeviceInfo = subscription.DeviceInfo,
                CreatedAt = subscription.CreatedAt,
                LastUsedAt = subscription.LastUsedAt,
                IsActive = subscription.IsActive
            };
        }

        private NotificationPreferenceDto MapToPreferenceDto(NotificationPreference preference)
        {
            return new NotificationPreferenceDto
            {
                Id = preference.Id,
                UserId = preference.UserId,
                EnablePush = preference.EnablePush,
                ReservationNotifications = preference.ReservationNotifications,
                GPSAlerts = preference.GPSAlerts,
                MaintenanceAlerts = preference.MaintenanceAlerts,
                SystemNotifications = preference.SystemNotifications,
                SecurityAlerts = preference.SecurityAlerts,
                FleetAlerts = preference.FleetAlerts,
                ExpenseNotifications = preference.ExpenseNotifications,
                InvoiceNotifications = preference.InvoiceNotifications,
                TicketNotifications = preference.TicketNotifications,
                CriticalOnly = preference.CriticalOnly,
                EnableQuietHours = preference.EnableQuietHours,
                QuietHoursStart = preference.QuietHoursStart,
                QuietHoursEnd = preference.QuietHoursEnd,
                EnableSound = preference.EnableSound,
                EnableVibration = preference.EnableVibration,
                ShowPreview = preference.ShowPreview,
                CreatedAt = preference.CreatedAt,
                UpdatedAt = preference.UpdatedAt
            };
        }
    }
}