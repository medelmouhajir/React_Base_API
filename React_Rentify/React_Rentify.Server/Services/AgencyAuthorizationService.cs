using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Users;
using System.Security.Claims;

namespace React_Rentify.Server.Services
{
    /// <summary>
    /// Service for checking user access to agency-related data
    /// </summary>
    public class AgencyAuthorizationService : IAgencyAuthorizationService
    {
        private readonly UserManager<User> _userManager;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly MainDbContext _context;
        private readonly ILogger<AgencyAuthorizationService> _logger;

        public AgencyAuthorizationService(
            UserManager<User> userManager,
            IHttpContextAccessor httpContextAccessor,
            MainDbContext context,
            ILogger<AgencyAuthorizationService> logger)
        {
            _userManager = userManager;
            _httpContextAccessor = httpContextAccessor;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Checks if the current user has access to the specified agency's data
        /// </summary>
        public async Task<bool> HasAccessToAgencyAsync(Guid agencyId)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                _logger.LogWarning("No authenticated user found when checking agency access");
                return false;
            }

            return await HasAccessToAgencyAsync(agencyId, userId);
        }

        /// <summary>
        /// Checks if the specified user has access to the specified agency's data
        /// </summary>
        public async Task<bool> HasAccessToAgencyAsync(Guid agencyId, string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found when checking agency access", userId);
                    return false;
                }

                // Admin users have access to all agencies
                if ( await _userManager.IsInRoleAsync(user , "Admin"))
                {
                    _logger.LogDebug("Admin user {UserId} granted access to agency {AgencyId}", userId, agencyId);
                    return true;
                }

                // Owner and Manager users can only access their own agency
                if (await _userManager.IsInRoleAsync(user, "Owner") || await _userManager.IsInRoleAsync(user, "Manager"))
                {
                    var hasAccess = user.AgencyId == agencyId;
                    _logger.LogDebug("User {UserId} with role {Role} {AccessResult} access to agency {AgencyId}",
                        userId, user.Role, hasAccess ? "granted" : "denied", agencyId);
                    return hasAccess;
                }

                // Customer users don't have access to agency data
                if (user.Role == User_Role.Customer)
                {
                    _logger.LogDebug("Customer user {UserId} denied access to agency {AgencyId}", userId, agencyId);
                    return false;
                }

                _logger.LogWarning("Unknown user role {Role} for user {UserId}", user.Role, userId);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking agency access for user {UserId} and agency {AgencyId}", userId, agencyId);
                return false;
            }
        }

        /// <summary>
        /// Gets the agency ID that the current user has access to
        /// </summary>
        public async Task<Guid?> GetUserAgencyIdAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            return await GetUserAgencyIdAsync(userId);
        }

        /// <summary>
        /// Gets the agency ID that the specified user has access to
        /// </summary>
        public async Task<Guid?> GetUserAgencyIdAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                if (user == null)
                {
                    _logger.LogWarning("User {UserId} not found when getting agency ID", userId);
                    return null;
                }

                // Admin users have access to all agencies (return null to indicate this)
                if (user.Role == User_Role.Admin)
                {
                    return null;
                }

                // Return the user's agency ID
                return user.AgencyId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting agency ID for user {UserId}", userId);
                return null;
            }
        }

        /// <summary>
        /// Checks if the current user is an Admin
        /// </summary>
        public async Task<bool> IsAdminAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return false;
            }

            return await IsAdminAsync(userId);
        }

        /// <summary>
        /// Checks if the specified user is an Admin
        /// </summary>
        public async Task<bool> IsAdminAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                return user?.Role == User_Role.Admin;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking admin status for user {UserId}", userId);
                return false;
            }
        }

        /// <summary>
        /// Gets the current user's role
        /// </summary>
        public async Task<User_Role?> GetUserRoleAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return null;
            }

            return await GetUserRoleAsync(userId);
        }

        /// <summary>
        /// Gets the specified user's role
        /// </summary>
        public async Task<User_Role?> GetUserRoleAsync(string userId)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(userId);
                return user?.Role;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user role for user {UserId}", userId);
                return null;
            }
        }

        /// <summary>
        /// Validates that the current user has access to the agency, throws UnauthorizedAccessException if not
        /// </summary>
        public async Task ValidateAgencyAccessAsync(Guid agencyId)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                throw new UnauthorizedAccessException("No authenticated user found");
            }

            await ValidateAgencyAccessAsync(agencyId, userId);
        }

        /// <summary>
        /// Validates that the specified user has access to the agency, throws UnauthorizedAccessException if not
        /// </summary>
        public async Task ValidateAgencyAccessAsync(Guid agencyId, string userId)
        {
            var hasAccess = await HasAccessToAgencyAsync(agencyId, userId);
            if (!hasAccess)
            {
                _logger.LogWarning("User {UserId} attempted to access agency {AgencyId} without permission", userId, agencyId);
                throw new UnauthorizedAccessException($"User does not have access to agency {agencyId}");
            }
        }

        /// <summary>
        /// Filters a list of agency IDs to only include those the current user has access to
        /// </summary>
        public async Task<List<Guid>> FilterAccessibleAgenciesAsync(IEnumerable<Guid> agencyIds)
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return new List<Guid>();
            }

            var isAdmin = await IsAdminAsync(userId);
            if (isAdmin)
            {
                // Admin has access to all agencies
                return agencyIds.ToList();
            }

            var userAgencyId = await GetUserAgencyIdAsync(userId);
            if (userAgencyId.HasValue)
            {
                // User can only access their own agency
                return agencyIds.Where(id => id == userAgencyId.Value).ToList();
            }

            return new List<Guid>();
        }

        /// <summary>
        /// Gets all agency IDs that the current user has access to
        /// </summary>
        public async Task<List<Guid>> GetAccessibleAgencyIdsAsync()
        {
            var userId = GetCurrentUserId();
            if (string.IsNullOrEmpty(userId))
            {
                return new List<Guid>();
            }

            var isAdmin = await IsAdminAsync(userId);
            if (isAdmin)
            {
                // Admin has access to all agencies
                return await _context.Set<Agency>()
                    .Select(a => a.Id)
                    .ToListAsync();
            }

            var userAgencyId = await GetUserAgencyIdAsync(userId);
            if (userAgencyId.HasValue)
            {
                return new List<Guid> { userAgencyId.Value };
            }

            return new List<Guid>();
        }

        /// <summary>
        /// Gets the current user's ID from the HTTP context
        /// </summary>
        private string? GetCurrentUserId()
        {
            return _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        }
    }
}
