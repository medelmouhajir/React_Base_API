using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AgencyStaffController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly MainDbContext _context;
        private readonly ILogger<AgencyStaffController> _logger;

        public AgencyStaffController(
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            MainDbContext context,
            ILogger<AgencyStaffController> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/AgencyStaff/agency/{agencyId}
        /// Retrieves all staff users (Owner and Manager) for a specified agency.
        /// </summary>
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetStaffByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving staff for Agency {AgencyId}", agencyId);

            var agencyExists = await _context.Set<Agency>()
                                             .AnyAsync(a => a.Id == agencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' does not exist." });
            }

            // Fetch users whose AgencyId matches
            var users = await _userManager.Users
                .Where(u => u.AgencyId == agencyId)
                .ToListAsync();

            var dtoList = users.Select(u => new StaffDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role.ToString(),
                AgencyId = u.AgencyId,
                IsActive = u.IsActive,
                CreatedAt = u.CreatedAt,
                Picture = u.Picture
            }).ToList();

            _logger.LogInformation("Retrieved {Count} staff members for Agency {AgencyId}", dtoList.Count, agencyId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/AgencyStaff
        /// Creates a new staff user (Owner or Manager) under an agency.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDto dto)
        {
            _logger.LogInformation("Creating new staff user in Agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateStaffDto received");
                return BadRequest(ModelState);
            }

            // Validate Agency exists
            var agencyExists = await _context.Set<Agency>()
                                             .AnyAsync(a => a.Id == dto.AgencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
            }

            // Validate Role
            if (!Enum.TryParse<User_Role>(dto.Role, out var parsedRole) ||
                (parsedRole != User_Role.Owner && parsedRole != User_Role.Manager))
            {
                _logger.LogWarning("Invalid role {Role} in CreateStaffDto", dto.Role);
                return BadRequest(new { message = "Role must be either 'Owner' or 'Manager'." });
            }

            // Ensure email/username is unique
            var existingUser = await _userManager.FindByEmailAsync(dto.Email);
            if (existingUser != null)
            {
                _logger.LogWarning("Email {Email} already in use", dto.Email);
                return Conflict(new { message = "Email is already registered." });
            }

            var user = new User
            {
                UserName = dto.Email,
                Email = dto.Email,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Role = parsedRole,
                AgencyId = dto.AgencyId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                Picture = dto.Picture
            };

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                foreach (var error in createResult.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                _logger.LogWarning("Failed to create user {Email}: {Errors}", dto.Email, createResult.Errors.Select(e => e.Description));
                return BadRequest(ModelState);
            }

            // Ensure role exists in IdentityRole store
            var roleName = dto.Role;
            if (!await _roleManager.RoleExistsAsync(roleName))
            {
                await _roleManager.CreateAsync(new IdentityRole(roleName));
            }

            await _userManager.AddToRoleAsync(user, roleName);

            _logger.LogInformation("Created staff user {UserId} with role {Role}", user.Id, roleName);

            var resultDto = new StaffDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                AgencyId = user.AgencyId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Picture = user.Picture
            };

            return CreatedAtAction(nameof(GetStaffByAgencyId), new { agencyId = user.AgencyId }, resultDto);
        }

        /// <summary>
        /// PUT: api/AgencyStaff/{id}
        /// Updates an existing staff user's details (except password). Role and IsActive can be changed.
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStaff(string id, [FromBody] UpdateStaffDto dto)
        {
            _logger.LogInformation("Updating staff user {UserId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateStaffDto for User {UserId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User with Id {UserId} not found", id);
                return NotFound(new { message = $"User with Id '{id}' not found." });
            }

            // Only allow changing AgencyId if role is Owner/Manager and user running this action is PlatformAdmin
            if (user.AgencyId != dto.AgencyId)
            {
                var agencyExists = await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId);
                if (!agencyExists)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
                }
                user.AgencyId = dto.AgencyId;
            }

            user.FullName = dto.FullName;
            user.PhoneNumber = dto.PhoneNumber;
            user.IsActive = dto.IsActive;
            user.Picture = dto.Picture;

            // Handle role change
            if (!Enum.TryParse<User_Role>(dto.Role, out var newRole) ||
                (newRole != User_Role.Owner && newRole != User_Role.Manager))
            {
                _logger.LogWarning("Invalid role {Role} in UpdateStaffDto", dto.Role);
                return BadRequest(new { message = "Role must be either 'Owner' or 'Manager'." });
            }

            if (user.Role.ToString() != dto.Role)
            {
                // Remove old role claim
                var oldRoleName = user.Role.ToString();
                if (await _roleManager.RoleExistsAsync(oldRoleName))
                {
                    await _userManager.RemoveFromRoleAsync(user, oldRoleName);
                }

                // Add new role claim
                var newRoleName = dto.Role;
                if (!await _roleManager.RoleExistsAsync(newRoleName))
                {
                    await _roleManager.CreateAsync(new IdentityRole(newRoleName));
                }
                await _userManager.AddToRoleAsync(user, newRoleName);
                user.Role = newRole;
            }

            var updateResult = await _userManager.UpdateAsync(user);
            if (!updateResult.Succeeded)
            {
                foreach (var error in updateResult.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                _logger.LogWarning("Failed to update user {UserId}: {Errors}", id, updateResult.Errors.Select(e => e.Description));
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Updated staff user {UserId}", id);

            var resultDto = new StaffDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role.ToString(),
                AgencyId = user.AgencyId,
                IsActive = user.IsActive,
                CreatedAt = user.CreatedAt,
                Picture = user.Picture
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/AgencyStaff/{id}
        /// Deletes a staff user.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> RemoveStaff(string id)
        {
            _logger.LogInformation("Deleting staff user {UserId}", id);

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User with Id {UserId} not found", id);
                return NotFound(new { message = $"User with Id '{id}' not found." });
            }

            var deleteResult = await _userManager.DeleteAsync(user);
            if (!deleteResult.Succeeded)
            {
                foreach (var error in deleteResult.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                _logger.LogWarning("Failed to delete user {UserId}: {Errors}", id, deleteResult.Errors.Select(e => e.Description));
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Deleted staff user {UserId}", id);
            return NoContent();
        }

        /// <summary>
        /// POST: api/AgencyStaff/{id}/reset-password
        /// Resets a staff user's password.
        /// </summary>
        [HttpPost("{id}/reset-password")]
        public async Task<IActionResult> ResetPassword(string id, [FromBody] ResetPasswordDto dto)
        {
            _logger.LogInformation("Resetting password for user {UserId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid ResetPasswordDto for User {UserId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.UserId)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO UserId {DtoUserId}", id, dto.UserId);
                return BadRequest(new { message = "The Id in the URL does not match the UserId in the payload." });
            }

            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                _logger.LogWarning("User with Id {UserId} not found", id);
                return NotFound(new { message = $"User with Id '{id}' not found." });
            }

            // Generate password reset token
            var resetToken = await _userManager.GeneratePasswordResetTokenAsync(user);
            var resetResult = await _userManager.ResetPasswordAsync(user, resetToken, dto.NewPassword);

            if (!resetResult.Succeeded)
            {
                foreach (var error in resetResult.Errors)
                {
                    ModelState.AddModelError(string.Empty, error.Description);
                }
                _logger.LogWarning("Failed to reset password for user {UserId}: {Errors}", id, resetResult.Errors.Select(e => e.Description));
                return BadRequest(ModelState);
            }

            _logger.LogInformation("Password reset for user {UserId}", id);
            return NoContent();
        }
    }

    #region DTOs

    public class StaffDto
    {
        public string Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; }
        public Guid? AgencyId { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Picture { get; set; }
    }

    public class CreateStaffDto
    {
        public string Email { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; } // "Owner" or "Manager"
        public Guid AgencyId { get; set; }
        public string Password { get; set; }
        public string? Picture { get; set; }
    }

    public class UpdateStaffDto
    {
        public string Id { get; set; }
        public Guid AgencyId { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Role { get; set; } // "Owner" or "Manager"
        public bool IsActive { get; set; }
        public string? Picture { get; set; }
    }

    public class ResetPasswordDto
    {
        public string UserId { get; set; }
        public string NewPassword { get; set; }
    }

    #endregion
}
