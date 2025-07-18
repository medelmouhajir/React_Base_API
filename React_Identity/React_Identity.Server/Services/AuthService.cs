using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using React_Identity.Server.Data;
using React_Identity.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace React_Identity.Server.Services
{
    public class AuthService : IAuthService
    {
        private readonly IConfiguration _configuration;
        private readonly IdentityDbContext _context;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            IConfiguration configuration,
            IdentityDbContext context,
            ILogger<AuthService> logger)
        {
            _configuration = configuration;
            _context = context;
            _logger = logger;
        }

        public (byte[] hash, byte[] salt) HashPassword(string password)
        {
            // Generate salt
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[32];
            rng.GetBytes(salt);

            // Hash password with salt using PBKDF2
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(32);

            return (hash, salt);
        }

        public bool VerifyPassword(string password, byte[] hash, byte[] salt)
        {
            // If using BCrypt (legacy accounts), fall back to BCrypt verification
            if (salt.Length == 0)
            {
                try
                {
                    var hashString = Encoding.UTF8.GetString(hash);
                    return BCrypt.Net.BCrypt.Verify(password, hashString);
                }
                catch
                {
                    return false;
                }
            }

            // Use PBKDF2 for new accounts
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, 10000, HashAlgorithmName.SHA256);
            var computedHash = pbkdf2.GetBytes(32);

            return computedHash.SequenceEqual(hash);
        }

        public string GenerateApiKey()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);

            var result = new StringBuilder(64);
            result.Append("wan_");

            for (int i = 0; i < bytes.Length; i++)
            {
                result.Append(chars[bytes[i] % chars.Length]);
            }

            return result.ToString();
        }

        public string GenerateJwtToken(Account account)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
            var issuer = jwtSettings["Issuer"] ?? "identity-api";
            var audience = jwtSettings["Audience"] ?? "identity-clients";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, account.AccountId.ToString()),
                new Claim(ClaimTypes.Email, account.Email),
                new Claim("account_id", account.AccountId.ToString()),
                new Claim("api_key", account.ApiKey ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
                new Claim(JwtRegisteredClaimNames.Iat,
                    new DateTimeOffset(DateTime.UtcNow).ToUnixTimeSeconds().ToString(),
                    ClaimValueTypes.Integer64)
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(24),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidateApiKey(string apiKey)
        {
            if (string.IsNullOrWhiteSpace(apiKey))
                return false;

            // Basic format validation
            return apiKey.StartsWith("wan_") && apiKey.Length >= 20;
        }

        public async Task<Account?> GetAccountFromApiKeyAsync(string apiKey)
        {
            if (!ValidateApiKey(apiKey))
                return null;

            try
            {
                return await _context.Accounts
                    .FirstOrDefaultAsync(a => a.ApiKey == apiKey && a.IsActive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving account for API key");
                return null;
            }
        }
    }
}