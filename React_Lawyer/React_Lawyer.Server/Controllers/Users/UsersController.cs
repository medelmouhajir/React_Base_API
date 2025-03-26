using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Users;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace React_Lawyer.Server.Controllers.Users
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UsersController> _logger;

        public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            return await _context.Users.ToListAsync();
        }

        // GET: api/Users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);

            if (user == null)
            {
                return NotFound();
            }

            return user;
        }


        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, User user)
        {
            if (id != user.UserId)
            {
                return BadRequest();
            }

            // If password is being updated, hash it
            var existingUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.UserId == id);
            if (existingUser != null && existingUser.PasswordHash != user.PasswordHash)
            {
                user.PasswordHash = HashPassword(user.PasswordHash);
            }

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Users/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            // Instead of deleting, set as inactive
            user.IsActive = false;
            _context.Entry(user).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }


        // GET: api/Users/Lawyers
        [HttpGet("lawyers")]
        public async Task<ActionResult<IEnumerable<User>>> GetLawyers()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Lawyer && u.IsActive)
                .ToListAsync();
        }

        // GET: api/Users/Secretaries
        [HttpGet("secretaries")]
        public async Task<ActionResult<IEnumerable<User>>> GetSecretaries()
        {
            return await _context.Users
                .Where(u => u.Role == UserRole.Secretary && u.IsActive)
                .ToListAsync();
        }

        // GET: api/Users/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<User>>> GetUsersByFirm(int firmId)
        {
            var lawyerIds = await _context.Lawyers
                .Where(l => l.LawFirmId == firmId)
                .Select(l => l.UserId)
                .ToListAsync();

            var secretaryIds = await _context.Secretaries
                .Where(s => s.LawFirmId == firmId)
                .Select(s => s.UserId)
                .ToListAsync();

            var adminIds = await _context.Admins
                .Where(a => a.ManagedFirms.Any(f => f.LawFirmId == firmId))
                .Select(a => a.UserId)
                .ToListAsync();

            var allIds = lawyerIds.Concat(secretaryIds).Concat(adminIds).Distinct();

            return await _context.Users
                .Where(u => allIds.Contains(u.UserId) && u.IsActive)
                .ToListAsync();
        }

        // Helper methods
        private bool UserExists(int id)
        {
            return _context.Users.Any(e => e.UserId == id);
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string storedHash)
        {
            var hashedPassword = HashPassword(password);
            return hashedPassword == storedHash;
        }
    }

    public class LoginModel
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }
    public class RegisterModel
    {

        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(100)]
        public string PasswordHash { get; set; }

        [StringLength(100)]
        public string FirstName { get; set; }

        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [Required]
        public string Role { get; set; }
    }
}