using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Users;
using System.Text;
using System.Security.Cryptography;
using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersProfileController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersProfileController> _logger;

        public UsersProfileController(ApplicationDbContext context, ILogger<UsersProfileController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            try
            {
                var users = await _context.Users
                    .Where(u => u.IsActive)
                    .Select(u => new User
                    {
                        UserId = u.UserId,
                        Username = u.Username,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        PhoneNumber = u.PhoneNumber,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        LastLogin = u.LastLogin,
                        IsActive = u.IsActive
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all users");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            try
            {
                var user = await _context.Users
                    .Where(u => u.UserId == id)
                    .Select(u => new User
                    {
                        UserId = u.UserId,
                        Username = u.Username,
                        Email = u.Email,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        PhoneNumber = u.PhoneNumber,
                        Role = u.Role,
                        CreatedAt = u.CreatedAt,
                        LastLogin = u.LastLogin,
                        IsActive = u.IsActive
                    })
                    .FirstOrDefaultAsync();

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user with ID {UserId}", id);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, UserUpdateModel model)
        {
            if (id != model.UserId)
            {
                return BadRequest(new { message = "User ID mismatch" });
            }

            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Update basic user properties
                user.FirstName = model.FirstName;
                user.LastName = model.LastName;
                user.Email = model.Email;
                user.PhoneNumber = model.PhoneNumber;

                // Update role-specific properties
                if (user.Role == UserRole.Lawyer && model.LawyerData != null)
                {
                    var lawyer = await _context.Lawyers.FirstOrDefaultAsync(l => l.UserId == id);
                    if (lawyer != null)
                    {
                        lawyer.Title = model.LawyerData.Title;
                        lawyer.Biography = model.LawyerData.Biography;
                        lawyer.BarNumber = model.LawyerData.BarNumber;
                        lawyer.Specializations = model.LawyerData.Specializations;
                    }
                }
                else if (user.Role == UserRole.Secretary && model.SecretaryData != null)
                {
                    var secretary = await _context.Secretaries.FirstOrDefaultAsync(s => s.UserId == id);
                    if (secretary != null)
                    {
                        secretary.Position = model.SecretaryData.Position;
                    }
                }
                else if (user.Role == UserRole.Admin && model.AdminData != null)
                {
                    var admin = await _context.Admins.FirstOrDefaultAsync(a => a.UserId == id);
                    if (admin != null)
                    {
                        admin.Position = model.AdminData.Position;
                    }
                }

                await _context.SaveChangesAsync();
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating user with ID {UserId}", id);
                return StatusCode(500, new { message = "Internal server error updating user" });
            }
        }

        // POST: api/Users/5/ChangePassword
        [HttpPost("{id}/ChangePassword")]
        public async Task<IActionResult> ChangePassword(int id, PasswordChangeModel model)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // Verify current password
                if (!VerifyPasswordHash(model.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect" });
                }

                // Update with new password
                user.PasswordHash = CreatePasswordHash(model.NewPassword);

                await _context.SaveChangesAsync();
                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing password for user with ID {UserId}", id);
                return StatusCode(500, new { message = "Internal server error changing password" });
            }
        }

        // PUT: api/Users/5/Notifications/Preferences
        [HttpPut("{id}/Notifications/Preferences")]
        public async Task<IActionResult> UpdateNotificationPreferences(int id, NotificationPreferencesModel model)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                // In a real application, you would update user notification preferences here
                // This is a placeholder for demonstration purposes

                return Ok(new { message = "Notification preferences updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification preferences for user with ID {UserId}", id);
                return StatusCode(500, new { message = "Internal server error updating notification preferences" });
            }
        }

        // POST: api/Users/5/Deactivate
        [HttpPost("{id}/Deactivate")]
        public async Task<IActionResult> DeactivateAccount(int id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);

                if (user == null)
                {
                    return NotFound(new { message = "User not found" });
                }

                user.IsActive = false;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Account deactivated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deactivating account for user with ID {UserId}", id);
                return StatusCode(500, new { message = "Internal server error deactivating account" });
            }
        }

        // Private helper methods
        private bool VerifyPasswordHash(string password, string storedHash)
        {
            // In a real application, you would use a proper password hashing mechanism
            // This is a simplified version for demonstration purposes
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                string hash = Convert.ToBase64String(hashBytes);
                return hash == storedHash;
            }
        }

        private string CreatePasswordHash(string password)
        {
            // In a real application, you would use a proper password hashing mechanism
            // This is a simplified version for demonstration purposes
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashBytes);
            }
        }
    }

    // Models for request/response
    public class UserUpdateModel
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        // Role-specific data models
        public LawyerUpdateModel LawyerData { get; set; }
        public SecretaryUpdateModel SecretaryData { get; set; }
        public AdminUpdateModel AdminData { get; set; }
    }

    public class LawyerUpdateModel
    {
        [StringLength(100)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Biography { get; set; }

        [StringLength(100)]
        public string BarNumber { get; set; }

        [StringLength(500)]
        public string Specializations { get; set; }
    }

    public class SecretaryUpdateModel
    {
        [StringLength(100)]
        public string Position { get; set; }
    }

    public class AdminUpdateModel
    {
        [StringLength(100)]
        public string Position { get; set; }
    }

    public class PasswordChangeModel
    {
        [Required]
        public string CurrentPassword { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 8)]
        public string NewPassword { get; set; }
    }

    public class NotificationPreferencesModel
    {
        public bool EmailNotifications { get; set; }
        public bool AppNotifications { get; set; }
        public int RemindersBefore { get; set; }
    }
}