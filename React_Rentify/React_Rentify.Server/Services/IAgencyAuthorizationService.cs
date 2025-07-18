using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Services
{
    /// <summary>
    /// Service interface for checking user access to agency-related data
    /// </summary>
    public interface IAgencyAuthorizationService
    {
        /// <summary>
        /// Checks if the current user has access to the specified agency's data
        /// </summary>
        /// <param name="agencyId">The agency ID to check access for</param>
        /// <returns>True if the user has access, false otherwise</returns>
        Task<bool> HasAccessToAgencyAsync(Guid agencyId);

        /// <summary>
        /// Checks if the current user has access to the specified agency's data
        /// </summary>
        /// <param name="agencyId">The agency ID to check access for</param>
        /// <param name="userId">The user ID to check access for</param>
        /// <returns>True if the user has access, false otherwise</returns>
        Task<bool> HasAccessToAgencyAsync(Guid agencyId, string userId);

        /// <summary>
        /// Gets the agency ID that the current user has access to
        /// Returns null if user is Admin (has access to all agencies)
        /// </summary>
        /// <returns>Agency ID or null for Admin users</returns>
        Task<Guid?> GetUserAgencyIdAsync();

        /// <summary>
        /// Gets the agency ID that the specified user has access to
        /// </summary>
        /// <param name="userId">The user ID to get agency for</param>
        /// <returns>Agency ID or null for Admin users</returns>
        Task<Guid?> GetUserAgencyIdAsync(string userId);

        /// <summary>
        /// Checks if the current user is an Admin (has access to all agencies)
        /// </summary>
        /// <returns>True if user is Admin, false otherwise</returns>
        Task<bool> IsAdminAsync();

        /// <summary>
        /// Checks if the specified user is an Admin
        /// </summary>
        /// <param name="userId">The user ID to check</param>
        /// <returns>True if user is Admin, false otherwise</returns>
        Task<bool> IsAdminAsync(string userId);

        /// <summary>
        /// Gets the current user's role
        /// </summary>
        /// <returns>User role</returns>
        Task<User_Role?> GetUserRoleAsync();

        /// <summary>
        /// Gets the specified user's role
        /// </summary>
        /// <param name="userId">The user ID to get role for</param>
        /// <returns>User role</returns>
        Task<User_Role?> GetUserRoleAsync(string userId);

        /// <summary>
        /// Validates that the current user has access to the agency, throws UnauthorizedAccessException if not
        /// </summary>
        /// <param name="agencyId">The agency ID to validate access for</param>
        /// <exception cref="UnauthorizedAccessException">Thrown when user doesn't have access</exception>
        Task ValidateAgencyAccessAsync(Guid agencyId);

        /// <summary>
        /// Validates that the specified user has access to the agency, throws UnauthorizedAccessException if not
        /// </summary>
        /// <param name="agencyId">The agency ID to validate access for</param>
        /// <param name="userId">The user ID to validate access for</param>
        /// <exception cref="UnauthorizedAccessException">Thrown when user doesn't have access</exception>
        Task ValidateAgencyAccessAsync(Guid agencyId, string userId);

        /// <summary>
        /// Filters a list of agency IDs to only include those the current user has access to
        /// </summary>
        /// <param name="agencyIds">List of agency IDs to filter</param>
        /// <returns>Filtered list of agency IDs the user has access to</returns>
        Task<List<Guid>> FilterAccessibleAgenciesAsync(IEnumerable<Guid> agencyIds);

        /// <summary>
        /// Gets all agency IDs that the current user has access to
        /// </summary>
        /// <returns>List of agency IDs the user has access to</returns>
        Task<List<Guid>> GetAccessibleAgencyIdsAsync();
    }
}
