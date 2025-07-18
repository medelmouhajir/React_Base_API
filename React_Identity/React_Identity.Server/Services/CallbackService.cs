
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.DTOs;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace React_Identity.Server.Services
{
    public class CallbackService : ICallbackService
    {
        private readonly IdentityDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CallbackService> _logger;

        public CallbackService(
            IdentityDbContext context,
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<CallbackService> logger)
        {
            _context = context;
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendCallbackAsync(Guid requestId, CallbackPayloadDto payload)
        {
            try
            {
                var request = await _context.VerificationRequests
                    .Include(r => r.Account)
                    .ThenInclude(a => a.CallbackUrls.Where(c => c.IsActive))
                    .FirstOrDefaultAsync(r => r.RequestId == requestId);

                if (request?.Account?.CallbackUrls == null || !request.Account.CallbackUrls.Any())
                {
                    _logger.LogInformation("No active callback URLs found for request: {RequestId}", requestId);
                    return;
                }

                var maxRetries = _configuration.GetValue<int>("Callbacks:RetryAttempts", 3);

                foreach (var callbackUrl in request.Account.CallbackUrls)
                {
                    var success = false;
                    var attempt = 0;

                    while (!success && attempt < maxRetries)
                    {
                        attempt++;
                        try
                        {
                            // Generate HMAC signature for payload verification
                            var signedPayload = SignPayload(payload, request.Account.ApiKey ?? "");

                            // Send HTTP POST request
                            var json = JsonSerializer.Serialize(signedPayload);
                            var content = new StringContent(json, Encoding.UTF8, "application/json");

                            _httpClient.Timeout = TimeSpan.FromSeconds(30);
                            var response = await _httpClient.PostAsync(callbackUrl.Url, content);

                            if (response.IsSuccessStatusCode)
                            {
                                success = true;
                                _logger.LogInformation("Callback sent successfully to {Url} for request: {RequestId}",
                                    callbackUrl.Url, requestId);
                            }
                            else
                            {
                                _logger.LogWarning("Callback failed with status {StatusCode} to {Url} for request: {RequestId}, attempt {Attempt}",
                                    response.StatusCode, callbackUrl.Url, requestId, attempt);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error sending callback to {Url} for request: {RequestId}, attempt {Attempt}",
                                callbackUrl.Url, requestId, attempt);
                        }

                        if (!success && attempt < maxRetries)
                        {
                            var delaySeconds = _configuration.GetValue<int>("Callbacks:RetryDelaySeconds", 5);
                            await Task.Delay(TimeSpan.FromSeconds(delaySeconds * attempt));
                        }
                    }

                    if (!success)
                    {
                        _logger.LogError("Failed to send callback to {Url} for request: {RequestId} after {MaxRetries} attempts",
                            callbackUrl.Url, requestId, maxRetries);
                    }
                }

                // Update callback status
                request.CallbackSent = true;
                request.CallbackAttempts = maxRetries;
                request.LastCallbackAttempt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in callback service for request: {RequestId}", requestId);
            }
        }

        public async Task RetryFailedCallbacksAsync()
        {
            try
            {
                var failedRequests = await _context.VerificationRequests
                    .Include(r => r.Account)
                    .ThenInclude(a => a.CallbackUrls.Where(c => c.IsActive))
                    .Where(r => !r.CallbackSent &&
                               r.Status == Models.VerificationStatus.Completed &&
                               r.CompletedAt.HasValue &&
                               r.CallbackAttempts < 3)
                    .ToListAsync();

                foreach (var request in failedRequests)
                {
                    var payload = new CallbackPayloadDto
                    {
                        AccountId = request.AccountId,
                        RequestId = request.RequestId,
                        VerificationResult = request.Status == Models.VerificationStatus.Completed ? "approved" : "rejected",
                        ExternalReference = request.ExternalReference,
                        Timestamp = DateTime.UtcNow
                    };

                    await SendCallbackAsync(request.RequestId, payload);
                }

                _logger.LogInformation("Processed {Count} failed callback retries", failedRequests.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrying failed callbacks");
            }
        }

        private CallbackPayloadDto SignPayload(CallbackPayloadDto payload, string secret)
        {
            var json = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });
            var signature = ComputeHmacSha256(json, secret);

            payload.Signature = signature;
            return payload;
        }

        private string ComputeHmacSha256(string data, string secret)
        {
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
            return Convert.ToBase64String(hash);
        }
    }
}