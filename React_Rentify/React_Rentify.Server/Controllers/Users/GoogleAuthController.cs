using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using React_Rentify.Server.Models.Users;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace React_Rentify.Server.Controllers.Users
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
            // Log the start of authentication
            _logger.LogInformation("Starting Google authentication with return URL: {ReturnUrl}", returnUrl);

            // Create authentication properties
            var properties = new AuthenticationProperties
            {
                RedirectUri = Url.Action(nameof(HandleGoogleCallback)),
                Items = { { "returnUrl", returnUrl } }  // Store returnUrl in Items instead of cookie
            };

            // Start the challenge
            return Challenge(properties, "Google");
        }

        [HttpGet("signin-google-callback")]  // More explicit callback path
        public async Task<IActionResult> HandleGoogleCallback()
        {
            try
            {
                _logger.LogInformation("HandleGoogleCallback started");

                // Get the authentication result
                var authenticateResult = await HttpContext.AuthenticateAsync("Google");

                if (!authenticateResult.Succeeded)
                {
                    _logger.LogError("Google authentication failed: {Error}",
                        authenticateResult.Failure?.Message ?? "Unknown error");
                    return Redirect("/?error=GoogleAuthenticationFailed");
                }

                // Get external login info
                var info = await _signInManager.GetExternalLoginInfoAsync();

                if (info == null)
                {
                    _logger.LogError("External login info was null. Attempting alternative method...");

                    // Alternative method to get user info from the authenticated principal
                    var principal = authenticateResult.Principal;
                    if (principal == null)
                    {
                        _logger.LogError("Principal is also null");
                        return Redirect("/?error=NoPrincipalFound");
                    }

                    // Extract user information manually
                    var email = principal.FindFirstValue(ClaimTypes.Email)
                        ?? principal.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress");
                    var nameIdentifier = principal.FindFirstValue(ClaimTypes.NameIdentifier);

                    if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(nameIdentifier))
                    {
                        _logger.LogError("Could not extract email or identifier from principal");
                        return Redirect("/?error=MissingUserInfo");
                    }

                    // Process the user with the extracted information
                    return await ProcessGoogleUser(email, nameIdentifier, principal,
                        authenticateResult.Properties?.Items["returnUrl"] ?? "/");
                }

                // Normal flow with external login info
                return await ProcessExternalLoginInfo(info,
                    authenticateResult.Properties?.Items["returnUrl"] ?? "/");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during Google authentication callback");
                return Redirect($"/?error=GoogleAuthException&message={Uri.EscapeDataString(ex.Message)}");
            }
        }

        private async Task<IActionResult> ProcessExternalLoginInfo(ExternalLoginInfo info, string returnUrl)
        {
            // Try to sign in with external login
            var result = await _signInManager.ExternalLoginSignInAsync(
                info.LoginProvider,
                info.ProviderKey,
                isPersistent: false);

            if (result.Succeeded)
            {
                _logger.LogInformation("User logged in with {LoginProvider}", info.LoginProvider);
                var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
                return await GenerateTokenAndRedirect(user, returnUrl);
            }

            // Process new or unlinked user
            var email = info.Principal.FindFirstValue(ClaimTypes.Email);
            if (string.IsNullOrEmpty(email))
            {
                _logger.LogError("No email found in Google login info");
                return Redirect($"{returnUrl}?error=NoEmailInGoogleLogin");
            }

            return await CreateOrLinkUser(email, info, returnUrl);
        }

        private async Task<IActionResult> ProcessGoogleUser(
            string email,
            string googleId,
            ClaimsPrincipal principal,
            string returnUrl)
        {
            // Check if user exists by email
            var user = await _userManager.FindByEmailAsync(email);

            if (user != null)
            {
                // User exists, check if already linked to Google
                var logins = await _userManager.GetLoginsAsync(user);
                var googleLogin = logins.FirstOrDefault(l => l.LoginProvider == "Google");

                if (googleLogin == null)
                {
                    // Link the Google account
                    var userLoginInfo = new UserLoginInfo("Google", googleId, "Google");
                    var addLoginResult = await _userManager.AddLoginAsync(user, userLoginInfo);

                    if (!addLoginResult.Succeeded)
                    {
                        _logger.LogError("Failed to link Google account: {Errors}",
                            string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                        return Redirect($"{returnUrl}?error=FailedToLinkGoogleAccount");
                    }
                }

                // Sign in the user
                await _signInManager.SignInAsync(user, isPersistent: false);
                return await GenerateTokenAndRedirect(user, returnUrl);
            }

            // Create new user
            var firstName = principal.FindFirstValue(ClaimTypes.GivenName)
                ?? principal.FindFirstValue("given_name")
                ?? "";
            var lastName = principal.FindFirstValue(ClaimTypes.Surname)
                ?? principal.FindFirstValue("family_name")
                ?? "";

            if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName))
            {
                var emailPrefix = email.Split('@')[0];
                firstName = emailPrefix;
                lastName = "";
            }

            var newUser = new User
            {
                UserName = email,
                Email = email,
                FullName = firstName + ' ' + lastName,
                Role = User_Role.Customer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(newUser);
            if (!createResult.Succeeded)
            {
                _logger.LogError("Failed to create user: {Errors}",
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return Redirect($"{returnUrl}?error=FailedToCreateUser");
            }

            // Add to role
            await _userManager.AddToRoleAsync(newUser, "User");

            // Add Google login
            var loginInfo = new UserLoginInfo("Google", googleId, "Google");
            await _userManager.AddLoginAsync(newUser, loginInfo);

            // Sign in
            await _signInManager.SignInAsync(newUser, isPersistent: false);
            return await GenerateTokenAndRedirect(newUser, returnUrl);
        }

        private async Task<IActionResult> CreateOrLinkUser(string email, ExternalLoginInfo info, string returnUrl)
        {
            var user = await _userManager.FindByEmailAsync(email);

            if (user != null)
            {
                // User exists but isn't linked to Google
                _logger.LogInformation("Linking existing user to Google account");
                var addLoginResult = await _userManager.AddLoginAsync(user, info);

                if (addLoginResult.Succeeded)
                {
                    await _signInManager.SignInAsync(user, isPersistent: false);
                    return await GenerateTokenAndRedirect(user, returnUrl);
                }
                else
                {
                    _logger.LogError("Failed to link Google account: {Errors}",
                        string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                    return Redirect($"{returnUrl}?error=FailedToLinkGoogleAccount");
                }
            }

            // Create new user
            _logger.LogInformation("Creating new user from Google account");
            var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
            var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";

            if (string.IsNullOrEmpty(firstName) && string.IsNullOrEmpty(lastName))
            {
                var emailPrefix = email.Split('@')[0];
                firstName = emailPrefix;
                lastName = "";
            }

            var newUser = new User
            {
                UserName = email,
                Email = email,
                FullName = firstName + " " + lastName,
                Role = User_Role.Customer,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                EmailConfirmed = true
            };

            var createResult = await _userManager.CreateAsync(newUser);
            if (!createResult.Succeeded)
            {
                _logger.LogError("Failed to create user: {Errors}",
                    string.Join(", ", createResult.Errors.Select(e => e.Description)));
                return Redirect($"{returnUrl}?error=FailedToCreateUser");
            }

            // Add to role
            await _userManager.AddToRoleAsync(newUser, "User");

            // Add Google login
            var addLoginResult2 = await _userManager.AddLoginAsync(newUser, info);
            if (!addLoginResult2.Succeeded)
            {
                _logger.LogError("Failed to add Google login: {Errors}",
                    string.Join(", ", addLoginResult2.Errors.Select(e => e.Description)));
            }

            await _signInManager.SignInAsync(newUser, isPersistent: false);
            return await GenerateTokenAndRedirect(newUser, returnUrl);
        }

        private async Task<IActionResult> GenerateTokenAndRedirect(User user, string returnUrl)
        {
            var token = await GenerateJwtToken(user);
            var expiresAt = DateTime.UtcNow.AddMinutes(60);

            // URL encode the token to prevent issues with special characters
            var encodedToken = Uri.EscapeDataString(token);

            return Redirect($"{returnUrl}?token={encodedToken}&expiresAt={Uri.EscapeDataString(expiresAt.ToString("O"))}");
        }

        private async Task<string> GenerateJwtToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ??
                "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234";
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var roles = await _userManager.GetRolesAsync(user);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, $"{user.FullName}"),
                new Claim("fullName", user.FullName ?? ""),
            };

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
