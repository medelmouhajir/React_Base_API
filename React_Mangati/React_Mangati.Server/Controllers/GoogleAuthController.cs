using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using React_Mangati.Server.Models.Users;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace React_Mangati.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GoogleAuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly SignInManager<User> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GoogleAuthController> _logger;

        public GoogleAuthController(
            UserManager<User> userManager,
            SignInManager<User> signInManager,
            IConfiguration configuration,
            ILogger<GoogleAuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpGet("signin")]
        public IActionResult SignIn(string returnUrl = "/")
        {
            // Store the return URL in a temporary cookie
            Response.Cookies.Append("GoogleAuthReturnUrl", returnUrl, new CookieOptions
            {
                HttpOnly = true,
                Secure = Request.IsHttps,
                SameSite = SameSiteMode.Lax,
                Path = "/"
            });

            // Start the challenge
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action(nameof(HandleGoogleCallback))
            };

            return Challenge(properties, "Google");
        }

        [HttpGet("callback")]
        public async Task<IActionResult> HandleGoogleCallback()
        {
            try
            {
                // Retrieve the return URL from the cookie
                var returnUrl = "/";
                if (Request.Cookies.TryGetValue("GoogleAuthReturnUrl", out var storedReturnUrl))
                {
                    returnUrl = storedReturnUrl;
                    // Clear the cookie
                    Response.Cookies.Delete("GoogleAuthReturnUrl");
                }

                // Complete the authentication
                var info = await _signInManager.GetExternalLoginInfoAsync();

                if (info == null)
                {
                    _logger.LogError("External login info was null in HandleGoogleCallback");
                    return Redirect($"{returnUrl}?error=ExternalLoginInfoNull");
                }

                // Try to sign in with external login
                var result = await _signInManager.ExternalLoginSignInAsync(info.LoginProvider, info.ProviderKey, isPersistent: false);

                if (result.Succeeded)
                {
                    // User already exists and is linked to Google
                    _logger.LogInformation("User logged in with {LoginProvider}", info.LoginProvider);
                    var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
                    var token = await GenerateJwtToken(user);

                    return Redirect($"{returnUrl}?token={token}&expiresAt={DateTime.UtcNow.AddMinutes(60)}");
                }

                // If we get here, the user either doesn't exist or isn't linked to a Google account
                // Let's check if the email exists
                var email = info.Principal.FindFirstValue(ClaimTypes.Email);

                if (string.IsNullOrEmpty(email))
                {
                    _logger.LogError("No email found in Google login info");
                    return Redirect($"{returnUrl}?error=NoEmailInGoogleLogin");
                }

                var user2 = await _userManager.FindByEmailAsync(email);

                if (user2 != null)
                {
                    // User exists but isn't linked to Google, so let's link them
                    _logger.LogInformation("Linking existing user to Google account");
                    var addLoginResult = await _userManager.AddLoginAsync(user2, info);
                    if (addLoginResult.Succeeded)
                    {
                        await _signInManager.SignInAsync(user2, isPersistent: false);
                        var token = await GenerateJwtToken(user2);
                        return Redirect($"{returnUrl}?token={token}&expiresAt={DateTime.UtcNow.AddMinutes(60)}");
                    }
                    else
                    {
                        _logger.LogError("Failed to link Google account to existing user: {Errors}",
                            string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                        return Redirect($"{returnUrl}?error=FailedToLinkGoogleAccount");
                    }
                }
                else
                {
                    // User doesn't exist, so let's create a new user
                    _logger.LogInformation("Creating new user from Google account");
                    var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
                    var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";

                    // If name info is missing, try to extract from email or use defaults
                    if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName))
                    {
                        var emailPrefix = email.Split('@')[0];
                        if (emailPrefix.Contains('.'))
                        {
                            var parts = emailPrefix.Split('.');
                            firstName = parts[0];
                            lastName = parts.Length > 1 ? parts[1] : "";
                        }
                        else
                        {
                            firstName = emailPrefix;
                            lastName = "";
                        }
                    }

                    var newUser = new User
                    {
                        UserName = email,
                        Email = email,
                        FirstName = firstName,
                        LastName = lastName,
                        Role = "User",
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        EmailConfirmed = true
                    };

                    var createResult = await _userManager.CreateAsync(newUser);
                    if (createResult.Succeeded)
                    {
                        // Add the user to the User role
                        await _userManager.AddToRoleAsync(newUser, "User");

                        // Add the Google login to the user
                        var addLoginResult = await _userManager.AddLoginAsync(newUser, info);
                        if (addLoginResult.Succeeded)
                        {
                            await _signInManager.SignInAsync(newUser, isPersistent: false);
                            var token = await GenerateJwtToken(newUser);
                            return Redirect($"{returnUrl}?token={token}&expiresAt={DateTime.UtcNow.AddMinutes(60)}");
                        }
                        else
                        {
                            _logger.LogError("Failed to add Google login to new user: {Errors}",
                                string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                            return Redirect($"{returnUrl}?error=FailedToAddGoogleLogin");
                        }
                    }
                    else
                    {
                        _logger.LogError("Failed to create new user from Google account: {Errors}",
                            string.Join(", ", createResult.Errors.Select(e => e.Description)));
                        return Redirect($"{returnUrl}?error=FailedToCreateUser");
                    }
                }
            }
            catch (Exception ex)
            {
                // Log the detailed exception
                _logger.LogError(ex, "Error during Google authentication callback");
                return Redirect($"/?error=GoogleAuthException&message={ex.Message}");
            }
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
                new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
                new Claim("firstName", user.FirstName ?? ""),
                new Claim("lastName", user.LastName ?? ""),
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
}