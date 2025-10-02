// React_Rentify.Server/Services/Notifications/WebPushService.cs

using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Notifications;
using System.Text.Json;
using WebPush;

namespace React_Rentify.Server.Services.Notifications
{
    /// <summary>
    /// Service for sending Web Push notifications
    /// Requires: Install-Package WebPush
    /// </summary>
    public interface IWebPushService
    {
        Task<bool> SendNotificationAsync(string userId, object payload);
        Task<int> SendBulkNotificationsAsync(List<string> userIds, object payload);
        Task InitializeAsync();
    }

    public class WebPushService : IWebPushService
    {
        private readonly MainDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<WebPushService> _logger;
        private VapidDetails? _vapidDetails;

        public WebPushService(
            MainDbContext context,
            IConfiguration configuration,
            ILogger<WebPushService> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        /// <summary>
        /// Initialize VAPID keys on service startup
        /// </summary>
        public async Task InitializeAsync()
        {
            var publicKey = _configuration["WebPush:PublicKey"];
            var privateKey = _configuration["WebPush:PrivateKey"];
            var subject = _configuration["WebPush:Subject"] ?? "mailto:support@wansolutions.com";

            if (string.IsNullOrEmpty(publicKey) || string.IsNullOrEmpty(privateKey))
            {
                _logger.LogWarning("WebPush VAPID keys not configured. Generating new keys...");
                var keys = VapidHelper.GenerateVapidKeys();

                _logger.LogWarning("IMPORTANT: Add these keys to your appsettings.json:");
                _logger.LogWarning($"WebPush:PublicKey = {keys.PublicKey}");
                _logger.LogWarning($"WebPush:PrivateKey = {keys.PrivateKey}");

                // Use generated keys for this session
                publicKey = keys.PublicKey;
                privateKey = keys.PrivateKey;
            }

            _vapidDetails = new VapidDetails(subject, publicKey, privateKey);
            _logger.LogInformation("WebPush service initialized successfully");

            await Task.CompletedTask;
        }

        /// <summary>
        /// Send push notification to a specific user (all their active subscriptions)
        /// </summary>
        public async Task<bool> SendNotificationAsync(string userId, object payload)
        {
            try
            {
                if (_vapidDetails == null)
                {
                    _logger.LogError("VAPID details not initialized. Cannot send push notification.");
                    return false;
                }

                // Get all active subscriptions for this user
                var subscriptions = await _context.Set<Server.Models.Notifications.PushSubscription>()
                    .Where(s => s.UserId == userId && s.IsActive)
                    .ToListAsync();

                if (!subscriptions.Any())
                {
                    _logger.LogInformation("No active push subscriptions found for user {UserId}", userId);
                    return false;
                }

                var payloadJson = JsonSerializer.Serialize(payload);
                var webPushClient = new WebPushClient();
                var successCount = 0;

                foreach (var subscription in subscriptions)
                {
                    try
                    {
                        var pushSubscription = new WebPush.PushSubscription(
                            subscription.Endpoint,
                            subscription.P256dh,
                            subscription.Auth
                        );

                        await webPushClient.SendNotificationAsync(
                            pushSubscription,
                            payloadJson,
                            _vapidDetails
                        );

                        // Update last used timestamp
                        subscription.LastUsedAt = DateTime.UtcNow;
                        subscription.FailureCount = 0;
                        successCount++;

                        _logger.LogInformation("Push notification sent successfully to user {UserId}, endpoint {Endpoint}",
                            userId, subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length)));
                    }
                    catch (WebPushException ex)
                    {
                        _logger.LogWarning(ex, "Failed to send push notification to user {UserId}, endpoint {Endpoint}. Status: {Status}",
                            userId, subscription.Endpoint.Substring(0, Math.Min(50, subscription.Endpoint.Length)), ex.StatusCode);

                        // Handle subscription errors
                        if (ex.StatusCode == System.Net.HttpStatusCode.Gone ||
                            ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                        {
                            // Subscription expired or invalid - mark as inactive
                            subscription.IsActive = false;
                            _logger.LogInformation("Marking subscription as inactive due to {Status}", ex.StatusCode);
                        }
                        else
                        {
                            // Temporary failure - increment failure count
                            subscription.FailureCount++;
                            if (subscription.FailureCount >= 5)
                            {
                                subscription.IsActive = false;
                                _logger.LogWarning("Marking subscription as inactive after {Count} failures", subscription.FailureCount);
                            }
                        }
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Push notification sent to {Success}/{Total} subscriptions for user {UserId}",
                    successCount, subscriptions.Count, userId);

                return successCount > 0;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Send push notification to multiple users
        /// </summary>
        public async Task<int> SendBulkNotificationsAsync(List<string> userIds, object payload)
        {
            var successCount = 0;

            foreach (var userId in userIds)
            {
                if (await SendNotificationAsync(userId, payload))
                {
                    successCount++;
                }
            }

            return successCount;
        }
    }
}