// React_Lawyer/React_Lawyer.Server/Controllers/Auth/AuthController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using React_Lawyer.Server.Controllers.Users;
using React_Lawyer.Server.Data;
using Shared_Models.Firms;
using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace React_Lawyer.Server.Controllers.Auth
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            ApplicationDbContext context,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _context = context;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseModel>> Login(LoginRequestModel loginModel)
        {
            try
            {
                // Find the user by username
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == loginModel.Username && u.IsActive);

                if (user == null)
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                // Verify password (using the same hashing method as in UsersController)
                if (!VerifyPassword(loginModel.Password, user.PasswordHash))
                {
                    return Unauthorized(new { message = "Invalid username or password" });
                }

                // Update last login time
                user.LastLogin = DateTime.UtcNow;
                _context.Entry(user).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                // Get user's law firm ID
                int? lawFirmId = null;
                int? roleId = null;
                switch (user.Role)
                {
                    case UserRole.Lawyer:
                        var data_lawyer = await _context.Lawyers
                            .Where(l => l.UserId == user.UserId)
                            .Select(l => new
                            {
                                l.LawFirmId,
                                l.LawyerId
                            })
                            .FirstOrDefaultAsync();
                        lawFirmId = data_lawyer?.LawFirmId;
                        roleId = data_lawyer?.LawyerId;
                        break;
                    case UserRole.Secretary:
                        var data_secretary = await _context.Secretaries
                            .Where(s => s.UserId == user.UserId)
                            .Select(l => new
                            {
                                l.LawFirmId,
                                l.SecretaryId
                            })
                            .FirstOrDefaultAsync();
                        lawFirmId = data_secretary?.LawFirmId;
                        roleId = data_secretary?.SecretaryId;
                        break;
                    case UserRole.Admin:
                        var adminFirm = await _context.Admins
                            .Where(a => a.UserId == user.UserId)
                            .SelectMany(a => a.ManagedFirms)
                            .FirstOrDefaultAsync();
                        lawFirmId = adminFirm?.LawFirmId;
                        roleId = null;
                        break;
                }

                // Generate token
                var accessToken = GenerateJwtToken(user);
                var refreshToken = GenerateRefreshToken();
                var expiresIn = int.Parse(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60");

                // Save refresh token to the database
                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7); // Refresh token valid for 7 days
                _context.Update(user);
                await _context.SaveChangesAsync();

                // Set refresh token in an HTTP-only cookie
                SetRefreshTokenCookie(refreshToken);

                // Create response object
                var response = new LoginResponseModel
                {
                    UserId = user.UserId,
                    Username = user.Username,
                    Email = user.Email,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    Role = user.Role.ToString(),
                    RoleId = roleId,
                    LawFirmId = lawFirmId,
                    Token = accessToken,
                    RefreshToken = refreshToken,
                    ExpiresIn = expiresIn * 60 // Convert to seconds for client-side use
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login process");
                return StatusCode(500, new { message = "An error occurred during login" });
            }
        }

        [HttpPost("register")]
        public async Task<ActionResult<User>> CreateUser(RegisterModel user)
        {
            var newUser = new User
            {
                Username = user.Username,
                Email = user.Email,
                PasswordHash = HashPassword(user.PasswordHash),
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Role = Enum.Parse<UserRole>(user.Role),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,

            };


            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok();
        }
        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        [HttpPost("refresh-token")]
        public async Task<ActionResult<TokenRefreshResponseModel>> RefreshToken()
        {
            // Get refresh token from cookie
            var refreshToken = Request.Cookies["refreshToken"];

            if (string.IsNullOrEmpty(refreshToken))
            {
                return BadRequest(new { message = "Refresh token is required" });
            }

            // Find user with this refresh token
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken && u.IsActive);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid refresh token" });
            }

            // Check if refresh token is expired
            if (user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            {
                return Unauthorized(new { message = "Refresh token expired" });
            }

            // Generate new tokens
            var accessToken = GenerateJwtToken(user);
            var newRefreshToken = GenerateRefreshToken();
            var expiresIn = int.Parse(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60");

            // Update refresh token in database
            user.RefreshToken = newRefreshToken;
            user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
            _context.Update(user);
            await _context.SaveChangesAsync();

            // Set new refresh token in HTTP-only cookie
            SetRefreshTokenCookie(newRefreshToken);

            return Ok(new TokenRefreshResponseModel
            {
                Token = accessToken,
                RefreshToken = newRefreshToken,
                ExpiresIn = expiresIn * 60
            });
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            // Get refresh token from cookie
            var refreshToken = Request.Cookies["refreshToken"];

            if (!string.IsNullOrEmpty(refreshToken))
            {
                // Find the user with this refresh token
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.RefreshToken == refreshToken);

                if (user != null)
                {
                    // Clear refresh token in database
                    user.RefreshToken = null;
                    user.RefreshTokenExpiryTime = null;
                    _context.Update(user);
                    await _context.SaveChangesAsync();
                }
            }

            // Clear the cookie regardless of whether we found the user
            Response.Cookies.Delete("refreshToken", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None
            });

            return Ok(new { message = "Logged out successfully" });
        }

        #region Helper Methods

        private string GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.ASCII.GetBytes(jwtSettings["SecretKey"] ?? "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234");

            var tokenHandler = new JwtSecurityTokenHandler();
            var expiresIn = int.Parse(jwtSettings["ExpiresInMinutes"] ?? "60");

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.GivenName, user.FirstName),
                    new Claim(ClaimTypes.Surname, user.LastName),
                    new Claim(ClaimTypes.Role, user.Role.ToString())
                }),
                Expires = DateTime.UtcNow.AddMinutes(expiresIn),
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true,
                SameSite = SameSiteMode.None
            };
            Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                var hashedPassword = Convert.ToBase64String(hashedBytes);
                return hashedPassword == storedHash;
            }
        }

        #endregion
    }

    #region Models

    public class LoginRequestModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class LoginResponseModel
    {
        public int UserId { get; set; }
        public string Username { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string Role { get; set; }
        public int? RoleId { get; set; }
        public int? LawFirmId { get; set; }
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public int ExpiresIn { get; set; } // Expiration time in seconds
    }

    public class TokenRefreshResponseModel
    {
        public string Token { get; set; }
        public string RefreshToken { get; set; }
        public int ExpiresIn { get; set; } // Expiration time in seconds
    }

    #endregion
}