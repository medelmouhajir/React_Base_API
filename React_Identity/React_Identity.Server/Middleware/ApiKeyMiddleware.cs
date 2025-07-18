
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.Services;
using System.Security.Claims;

namespace React_Identity.Server
{
    public class ApiKeyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ApiKeyMiddleware> _logger;

        public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context, IAuthService authService)
        {
            // Skip middleware for health checks, swagger, and auth endpoints
            var path = context.Request.Path.Value?.ToLower();
            if (path != null && (
                path.StartsWith("/health") ||
                path.StartsWith("/swagger") ||
                path.StartsWith("/api/accounts/login") ||
                path.StartsWith("/api/accounts") && context.Request.Method == "POST"))
            {
                await _next(context);
                return;
            }

            // Check for API key in header
            if (context.Request.Headers.TryGetValue("X-Api-Key", out var apiKeyValues))
            {
                var apiKey = apiKeyValues.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    var account = await authService.GetAccountFromApiKeyAsync(apiKey);
                    if (account != null)
                    {
                        // Create claims for the API key user
                        var claims = new[]
                        {
                            new Claim(ClaimTypes.NameIdentifier, account.AccountId.ToString()),
                            new Claim(ClaimTypes.Email, account.Email),
                            new Claim("account_id", account.AccountId.ToString()),
                            new Claim("api_key", apiKey),
                            new Claim("auth_method", "api_key")
                        };

                        var identity = new ClaimsIdentity(claims, "ApiKey");
                        context.User = new ClaimsPrincipal(identity);

                        _logger.LogInformation("API key authentication successful for account: {AccountId}", account.AccountId);
                    }
                    else
                    {
                        _logger.LogWarning("Invalid API key attempted: {ApiKey}", apiKey.Substring(0, 8) + "...");
                    }
                }
            }

            await _next(context);
        }
    }
}