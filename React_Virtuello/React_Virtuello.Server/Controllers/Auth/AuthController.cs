using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using React_Virtuello.Server.Models.Users;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace React_Virtuello.Server.Controllers.Auth
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration,
            ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = new User
            {
                UserName = GetUsernameFromEmail(model.Email),
                Email = model.Email,
                Fullname = model.FullName,
                PhoneNumber = model.PhoneNumber,
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Picture_Path = null
            };

            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                // Add user to role
                await _userManager.AddToRoleAsync(user, GetRoleFromEnumToString(user.Role));

                var token = await GenerateJwtToken(user);

                return Ok(new
                {
                    Token = token,
                    User = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FullName = user.Fullname,
                        Role = GetRoleFromEnumToString(user.Role),
                        IsActive = user.IsActive
                    },
                    ExpiresAt = DateTime.UtcNow.AddMinutes(
                        int.Parse(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60"))
                });
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError(string.Empty, error.Description);
            }

            return BadRequest(ModelState);
        }

        private string GetRoleFromEnumToString(string role)
        {
            switch (role)
            {
                case "Admin":
                    return "Admin";
                case "Owner":
                    return "Owner";
                case "Manager":
                    return "Manager";
                default:
                    return "";
            }
        }

        private string GetUsernameFromEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains("@"))
                return string.Empty;

            int atIndex = email.IndexOf("@");
            return email.Substring(0, atIndex);
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = await _userManager.FindByEmailAsync(model.Email);
            if (user == null || !user.IsActive)
            {
                return Unauthorized(new { message = "Invalid credentials or account is disabled" });
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

            if (result.Succeeded)
            {
                var token = await GenerateJwtToken(user);

                return Ok(new
                {
                    Token = token,
                    User = new
                    {
                        Id = user.Id,
                        Email = user.Email,
                        FullName = user.Fullname,
                        Role = GetRoleFromEnumToString(user.Role),
                        IsActive = user.IsActive,
                        user.PhoneNumber
                    },
                    ExpiresAt = DateTime.UtcNow.AddMinutes(
                        int.Parse(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60"))
                });
            }

            return Unauthorized(new { message = "Invalid credentials" });
        }

        [HttpPost("refresh-token")]
        [Authorize]
        public async Task<IActionResult> RefreshToken()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null || !user.IsActive)
            {
                return Unauthorized();
            }

            var token = await GenerateJwtToken(user);

            return Ok(new
            {
                Token = token,
                User = new
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.Fullname,
                    Role = GetRoleFromEnumToString(user.Role),
                    IsActive = user.IsActive,
                    user.PhoneNumber
                },
                ExpiresAt = DateTime.UtcNow.AddMinutes(
                    int.Parse(_configuration["JwtSettings:ExpiresInMinutes"] ?? "60"))
            });
        }

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUser()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var user = await _userManager.FindByIdAsync(userId);

                if (user == null)
                {
                    return NotFound();
                }

                return Ok(new
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.Fullname,
                    Role = GetRoleFromEnumToString(user.Role),
                    IsActive = user.IsActive,
                    user.PhoneNumber
                });
            }
            catch (Exception ex)
            {
                _logger.LogInformation("Error in : AuthController => GetCurrentUser, error : " + ex.Message);
                return NotFound();
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            user.Fullname = model.FirstName + " " + model.LastName ?? user.Fullname;
            user.PhoneNumber = model.PhoneNumber ?? user.PhoneNumber;

            var result = await _userManager.UpdateAsync(user);

            if (result.Succeeded)
            {
                return Ok(new
                {
                    Id = user.Id,
                    Email = user.Email,
                    FullName = user.Fullname,
                    Role = GetRoleFromEnumToString(user.Role),
                    IsActive = user.IsActive
                });
            }

            return BadRequest(result.Errors);
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return NotFound();
            }

            var result = await _userManager.ChangePasswordAsync(user, model.CurrentPassword, model.NewPassword);

            if (result.Succeeded)
            {
                return Ok(new { message = "Password changed successfully" });
            }

            return BadRequest(result.Errors);
        }

        private async Task<string> GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ?? "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234";
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, $"{user.Fullname}"),
                new Claim("fullName", user.Fullname ?? ""),
            };


            // Add role claims
            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiresInMinutes"] ?? "60")),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    // DTOs and Models
    public class RegisterModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public string? Role { get; set; } = "User";
    }

    public class LoginModel
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class UpdateProfileModel
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
    }

    public class ChangePasswordModel
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new();
        public DateTime ExpiresAt { get; set; }
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
