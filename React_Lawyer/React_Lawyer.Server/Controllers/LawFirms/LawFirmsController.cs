using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Firms;
using Shared_Models.Users;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Require authentication for all endpoints
    public class LawFirmsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LawFirmsController> _logger;

        public LawFirmsController(ApplicationDbContext context, ILogger<LawFirmsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Get all active law firms
        /// </summary>
        /// <returns>List of active law firms</returns>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LawFirm>>> GetLawFirms()
        {
            try
            {
                _logger.LogInformation("Fetching all active law firms");
                return await _context.LawFirms
                    .Where(f => f.IsActive)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching law firms");
                return StatusCode(500, new { message = "An error occurred while fetching law firms" });
            }
        }

        /// <summary>
        /// Get a specific law firm by ID
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>The requested law firm</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult<LawFirm>> GetLawFirm(int id)
        {
            try
            {
                _logger.LogInformation("Fetching law firm with ID: {Id}", id);

                var lawFirm = await _context.LawFirms
                    .FirstOrDefaultAsync(f => f.LawFirmId == id);

                if (lawFirm == null)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                return lawFirm;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the law firm" });
            }
        }

        /// <summary>
        /// Get detailed information about a law firm including staff and active cases/clients
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>Detailed law firm information</returns>
        [HttpGet("{id}/Details")]
        public async Task<ActionResult<object>> GetLawFirmDetails(int id)
        {
            try
            {
                _logger.LogInformation("Fetching detailed information for law firm with ID: {Id}", id);

                var lawFirm = await _context.LawFirms
                    .Include(x=> x.Lawyers)
                    .ThenInclude(x => x.User)
                    .Include(x => x.Secretaries)
                    .ThenInclude(x => x.User)
                    .Include(x => x.Clients)
                    .FirstOrDefaultAsync(f => f.LawFirmId == id);

                if (lawFirm == null)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }



                var caseCount = await _context.Cases
                    .CountAsync(c => c.LawFirmId == id);



                var result = new
                {
                    LawFirm = new LawFirm {
                        LawFirmId = lawFirm.LawFirmId,
                        Name = lawFirm.Name,
                        Address = lawFirm.Address,
                        PhoneNumber = lawFirm.PhoneNumber,
                        Email = lawFirm.Email,
                        Website = lawFirm.Website,
                        TaxId = lawFirm.TaxId,
                        FoundedDate = lawFirm.FoundedDate,
                        CreatedAt = lawFirm.CreatedAt,
                        SubscriptionPlan = lawFirm.SubscriptionPlan,
                        SubscriptionExpiryDate = lawFirm.SubscriptionExpiryDate,
                        IsActive = lawFirm.IsActive,
                        BillingAddress = lawFirm.BillingAddress,
                        BillingContact = lawFirm.BillingContact
                    },
                    Lawyers = lawFirm.Lawyers.Select( l => new
                    {
                        l.LawyerId,
                        UserId = l.User.UserId,
                        FirstName = l.User.FirstName,
                        LastName = l.User.LastName,
                        PhoneNumber = l.User.PhoneNumber,
                        Email = l.User.Email,
                        BarNumber = l.BarNumber,
                        Title = l.Title,
                        Biography = l.Biography,
                        JoinDate = l.JoinDate,
                        Specializations = l.Specializations,
                        HourlyRate = l.HourlyRate
                    } ),
                    Secretaries = lawFirm.Secretaries.Select(s=> new
                    {
                        s.SecretaryId,
                        UserId = s.User.UserId,
                        FirstName = s.User.FirstName,
                        LastName = s.User.LastName,
                        PhoneNumber = s.User.PhoneNumber,
                        Email = s.User.Email,
                        Position = s.Position
                    }),
                    ClientCount = lawFirm.Clients.Count,
                    CaseCount = caseCount
                };

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching law firm details for ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the law firm details" });
            }
        }

        /// <summary>
        /// Get statistics for a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>Law firm statistics</returns>
        [HttpGet("{id}/Statistics")]
        public async Task<ActionResult<LawFirmStatisticsModel>> GetLawFirmStatistics(int id)
        {
            try
            {
                _logger.LogInformation("Fetching statistics for law firm with ID: {Id}", id);

                var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
                if (!lawFirmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                var statistics = new LawFirmStatisticsModel
                {
                    TotalCases = await _context.Cases.CountAsync(c => c.LawFirmId == id),
                    ActiveCases = await _context.Cases.CountAsync(c => c.LawFirmId == id &&
                                                              c.Status != Shared_Models.Cases.CaseStatus.Closed &&
                                                              c.Status != Shared_Models.Cases.CaseStatus.Archived),
                    ClosedCases = await _context.Cases.CountAsync(c => c.LawFirmId == id &&
                                                              (c.Status == Shared_Models.Cases.CaseStatus.Closed ||
                                                               c.Status == Shared_Models.Cases.CaseStatus.Archived)),
                    TotalClients = await _context.Clients.CountAsync(c => c.LawFirmId == id),
                    ActiveClients = await _context.Clients.CountAsync(c => c.LawFirmId == id && c.IsActive),
                    LawyerCount = await _context.Lawyers
                        .Where(l => l.LawFirmId == id && l.User.IsActive)
                        .CountAsync(),
                    SecretaryCount = await _context.Secretaries
                        .Where(s => s.LawFirmId == id && s.User.IsActive)
                        .CountAsync(),
                    UpcomingAppointments = await _context.Appointments
                        .CountAsync(a => a.LawFirmId == id &&
                                    a.StartTime > DateTime.UtcNow &&
                                    a.Status != Shared_Models.Appointments.AppointmentStatus.Cancelled),
                    TotalDocuments = await _context.Documents
                        .CountAsync(d => d.Case.LawFirmId == id),
                    TotalInvoices = await _context.Invoices
                        .CountAsync(i => i.LawFirmId == id),
                    OutstandingInvoices = await _context.Invoices
                        .CountAsync(i => i.LawFirmId == id &&
                                   i.Status != Shared_Models.Invoices.InvoiceStatus.Paid &&
                                   i.Status != Shared_Models.Invoices.InvoiceStatus.Cancelled)
                };

                return statistics;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching law firm statistics for ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the law firm statistics" });
            }
        }

        /// <summary>
        /// Create a new law firm
        /// </summary>
        /// <param name="model">Law firm creation data</param>
        /// <returns>The created law firm</returns>
        [HttpPost]
        [Authorize(Roles = "Admin")] // Only admins can create new firms
        public async Task<ActionResult<LawFirm>> CreateLawFirm(LawFirmCreationModel model)
        {
            try
            {
                _logger.LogInformation("Creating new law firm: {FirmName}", model.FirmName);

                // Validate model
                if (string.IsNullOrWhiteSpace(model.FirmName))
                {
                    return BadRequest(new { message = "Firm name is required" });
                }

                if (string.IsNullOrWhiteSpace(model.AdminUsername) ||
                    string.IsNullOrWhiteSpace(model.AdminEmail) ||
                    string.IsNullOrWhiteSpace(model.AdminPassword))
                {
                    return BadRequest(new { message = "Admin details are required" });
                }

                // Check if username already exists
                var usernameExists = await _context.Users.AnyAsync(u => u.Username == model.AdminUsername);
                if (usernameExists)
                {
                    return BadRequest(new { message = "Username already exists" });
                }

                // Check if email already exists
                var emailExists = await _context.Users.AnyAsync(u => u.Email == model.AdminEmail);
                if (emailExists)
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create admin user
                    var adminUser = new User
                    {
                        Username = model.AdminUsername,
                        Email = model.AdminEmail,
                        PasswordHash = model.AdminPassword, // This should be hashed in a real application
                        FirstName = model.AdminFirstName,
                        LastName = model.AdminLastName,
                        PhoneNumber = model.AdminPhone,
                        Role = UserRole.Admin,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Users.Add(adminUser);
                    await _context.SaveChangesAsync();

                    // Create law firm
                    var lawFirm = new LawFirm
                    {
                        Name = model.FirmName,
                        Address = model.FirmAddress,
                        PhoneNumber = model.FirmPhone,
                        Email = model.FirmEmail,
                        Website = model.FirmWebsite,
                        TaxId = model.FirmTaxId,
                        FoundedDate = model.FoundedDate,
                        CreatedAt = DateTime.UtcNow,
                        SubscriptionPlan = "Standard", // Default plan
                        SubscriptionExpiryDate = DateTime.UtcNow.AddYears(1), // Default 1 year subscription
                        IsActive = true,
                        BillingAddress = model.FirmAddress, // Default to same address
                        BillingContact = $"{model.AdminFirstName} {model.AdminLastName}" // Default to admin
                    };

                    _context.LawFirms.Add(lawFirm);
                    await _context.SaveChangesAsync();

                    // Create admin profile
                    var admin = new Admin
                    {
                        UserId = adminUser.UserId,
                        Position = "Administrator",
                        CanManageUsers = true,
                        CanManageBilling = true,
                        CanViewReports = true,
                        CanManageSettings = true
                    };

                    _context.Admins.Add(admin);
                    await _context.SaveChangesAsync();

                    // Associate admin with law firm
                    admin.ManagedFirms = new List<LawFirm> { lawFirm };
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetLawFirm), new { id = lawFirm.LawFirmId }, lawFirm);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error creating law firm");
                    throw; // Re-throw to be caught by the outer catch
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating law firm");
                return StatusCode(500, new { message = "An error occurred while creating the law firm" });
            }
        }

        /// <summary>
        /// Update an existing law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <param name="lawFirm">Updated law firm data</param>
        /// <returns>No content on success</returns>
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")] // Only admins can update firms
        public async Task<IActionResult> UpdateLawFirm(int id, LawFirm lawFirm)
        {
            try
            {
                _logger.LogInformation("Updating law firm with ID: {Id}", id);

                if (id != lawFirm.LawFirmId)
                {
                    _logger.LogWarning("ID mismatch in UpdateLawFirm: {PathId} vs {BodyId}", id, lawFirm.LawFirmId);
                    return BadRequest(new { message = "ID mismatch" });
                }

                // Ensure the firm exists
                var existingFirm = await _context.LawFirms.FindAsync(id);
                if (existingFirm == null)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                // Check if user is authorized to update this firm
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Unable to identify user" });
                }

                // For admin, check if they manage this firm
                var isAdmin = User.IsInRole("Admin");
                if (isAdmin)
                {
                    var adminManagesFirm = await _context.Admins
                        .Where(a => a.UserId == userId)
                        .SelectMany(a => a.ManagedFirms)
                        .AnyAsync(f => f.LawFirmId == id);

                    if (!adminManagesFirm)
                    {
                        return Forbid();
                    }
                }

                // Update only allowed fields
                existingFirm.Name = lawFirm.Name;
                existingFirm.Address = lawFirm.Address;
                existingFirm.PhoneNumber = lawFirm.PhoneNumber;
                existingFirm.Email = lawFirm.Email;
                existingFirm.Website = lawFirm.Website;
                existingFirm.TaxId = lawFirm.TaxId;
                existingFirm.BillingAddress = lawFirm.BillingAddress;
                existingFirm.BillingContact = lawFirm.BillingContact;

                // Don't update sensitive fields like IsActive, SubscriptionPlan, etc. directly
                // Those should have separate endpoints/methods

                _context.Entry(existingFirm).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    if (!LawFirmExists(id))
                    {
                        _logger.LogWarning("Law firm with ID {Id} not found after concurrency exception", id);
                        return NotFound(new { message = $"Law firm with ID {id} not found" });
                    }
                    else
                    {
                        _logger.LogError(ex, "Concurrency error updating law firm with ID: {Id}", id);
                        return StatusCode(500, new { message = "An error occurred while updating the law firm due to a concurrency issue" });
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while updating the law firm" });
            }
        }

        /// <summary>
        /// Delete (deactivate) a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>No content on success</returns>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")] // Only admins can delete firms
        public async Task<IActionResult> DeleteLawFirm(int id)
        {
            try
            {
                _logger.LogInformation("Deleting (deactivating) law firm with ID: {Id}", id);

                var lawFirm = await _context.LawFirms.FindAsync(id);
                if (lawFirm == null)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                // Check if user is authorized to delete this firm
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier);
                if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out int userId))
                {
                    return Unauthorized(new { message = "Unable to identify user" });
                }

                // For admin, check if they manage this firm
                var adminManagesFirm = await _context.Admins
                    .Where(a => a.UserId == userId)
                    .SelectMany(a => a.ManagedFirms)
                    .AnyAsync(f => f.LawFirmId == id);

                if (!adminManagesFirm)
                {
                    return Forbid();
                }

                // Instead of deleting, deactivate
                lawFirm.IsActive = false;
                _context.Entry(lawFirm).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the law firm" });
            }
        }

        /// <summary>
        /// Get all lawyers for a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>List of lawyers</returns>
        [HttpGet("{id}/Lawyers")]
        public async Task<ActionResult<IEnumerable<Lawyer>>> GetLawFirmLawyers(int id)
        {
            try
            {
                _logger.LogInformation("Fetching lawyers for law firm with ID: {Id}", id);

                // First check if the firm exists
                var firmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
                if (!firmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                return await _context.Lawyers
                    .Include(l => l.User)
                    .Where(l => l.LawFirmId == id && l.User.IsActive)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching lawyers for law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the lawyers" });
            }
        }

        /// <summary>
        /// Get secretaries for a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>List of secretaries</returns>
        [HttpGet("{id}/Secretaries")]
        public async Task<ActionResult<IEnumerable<Secretary>>> GetLawFirmSecretaries(int id)
        {
            try
            {
                _logger.LogInformation("Fetching secretaries for law firm with ID: {Id}", id);

                // First check if the firm exists
                var firmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
                if (!firmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                return await _context.Secretaries
                    .Include(s => s.User)
                    .Where(s => s.LawFirmId == id && s.User.IsActive)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching secretaries for law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the secretaries" });
            }
        }

        /// <summary>
        /// Get clients for a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>List of clients</returns>
        [HttpGet("{id}/Clients")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Clients.Client>>> GetLawFirmClients(int id)
        {
            try
            {
                _logger.LogInformation("Fetching clients for law firm with ID: {Id}", id);

                // First check if the firm exists
                var firmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
                if (!firmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                return await _context.Clients
                    .Where(c => c.LawFirmId == id && c.IsActive)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching clients for law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the clients" });
            }
        }

        /// <summary>
        /// Get cases for a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <returns>List of cases</returns>
        [HttpGet("{id}/Cases")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Cases.Case>>> GetLawFirmCases(int id)
        {
            try
            {
                _logger.LogInformation("Fetching cases for law firm with ID: {Id}", id);

                // First check if the firm exists
                var firmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
                if (!firmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found", id);
                    return NotFound(new { message = $"Law firm with ID {id} not found" });
                }

                return await _context.Cases
                    .Where(c => c.LawFirmId == id)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching cases for law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the cases" });
            }
        }

        /// <summary>
        /// Add a lawyer to a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <param name="model">Lawyer creation data</param>
        /// <returns>The created lawyer</returns>
        [HttpPost("{id}/Lawyers")]
        [Authorize(Roles = "Admin")] // Only admins can add lawyers
        public async Task<ActionResult<Lawyer>> AddLawyer(int id, LawyerCreationModel model)
        {
            try
            {
                _logger.LogInformation("Adding lawyer to law firm with ID: {Id}", id);

                var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id && f.IsActive);
                if (!lawFirmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found or inactive", id);
                    return NotFound(new { message = "Law firm not found or inactive" });
                }

                // Validate model
                if (string.IsNullOrWhiteSpace(model.Username) ||
                    string.IsNullOrWhiteSpace(model.Email) ||
                    string.IsNullOrWhiteSpace(model.Password))
                {
                    return BadRequest(new { message = "Username, email, and password are required" });
                }

                // Check if username already exists
                var usernameExists = await _context.Users.AnyAsync(u => u.Username == model.Username);
                if (usernameExists)
                {
                    return BadRequest(new { message = "Username already exists" });
                }

                // Check if email already exists
                var emailExists = await _context.Users.AnyAsync(u => u.Email == model.Email);
                if (emailExists)
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create user
                    var user = new User
                    {
                        Username = model.Username,
                        Email = model.Email,
                        PasswordHash = model.Password, // This should be hashed in a real application
                        FirstName = model.FirstName,
                        LastName = model.LastName,
                        PhoneNumber = model.Phone,
                        Role = UserRole.Lawyer,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    // Create lawyer profile
                    var lawyer = new Lawyer
                    {
                        UserId = user.UserId,
                        LawFirmId = id,
                        BarNumber = model.BarNumber,
                        Title = model.Title,
                        Biography = model.Biography,
                        JoinDate = DateTime.UtcNow,
                        Specializations = model.Specializations,
                        HourlyRate = model.HourlyRate
                    };

                    _context.Lawyers.Add(lawyer);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetLawFirmLawyers), new { id = id }, lawyer);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error adding lawyer to law firm with ID: {Id}", id);
                    throw; // Re-throw to be caught by the outer catch
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding lawyer to law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while adding the lawyer" });
            }
        }

        /// <summary>
        /// Add a secretary to a law firm
        /// </summary>
        /// <param name="id">The law firm ID</param>
        /// <param name="model">Secretary creation data</param>
        /// <returns>The created secretary</returns>
        [HttpPost("{id}/Secretaries")]
        [Authorize(Roles = "Admin")] // Only admins can add secretaries
        public async Task<ActionResult<Secretary>> AddSecretary(int id, SecretaryCreationModel model)
        {
            try
            {
                _logger.LogInformation("Adding secretary to law firm with ID: {Id}", id);

                var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id && f.IsActive);
                if (!lawFirmExists)
                {
                    _logger.LogWarning("Law firm with ID {Id} not found or inactive", id);
                    return NotFound(new { message = "Law firm not found or inactive" });
                }

                // Validate model
                if (string.IsNullOrWhiteSpace(model.Username) ||
                    string.IsNullOrWhiteSpace(model.Email) ||
                    string.IsNullOrWhiteSpace(model.Password))
                {
                    return BadRequest(new { message = "Username, email, and password are required" });
                }

                // Check if username already exists
                var usernameExists = await _context.Users.AnyAsync(u => u.Username == model.Username);
                if (usernameExists)
                {
                    return BadRequest(new { message = "Username already exists" });
                }

                // Check if email already exists
                var emailExists = await _context.Users.AnyAsync(u => u.Email == model.Email);
                if (emailExists)
                {
                    return BadRequest(new { message = "Email already exists" });
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create user
                    var user = new User
                    {
                        Username = model.Username,
                        Email = model.Email,
                        PasswordHash = model.Password, // This should be hashed in a real application
                        FirstName = model.FirstName,
                        LastName = model.LastName,
                        PhoneNumber = model.Phone,
                        Role = UserRole.Secretary,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    // Create secretary profile
                    var secretary = new Secretary
                    {
                        UserId = user.UserId,
                        LawFirmId = id,
                        Position = model.Position,
                        JoinDate = DateTime.UtcNow,
                        CanManageClients = model.CanManageClients,
                        CanScheduleAppointments = model.CanScheduleAppointments,
                        CanUploadDocuments = model.CanUploadDocuments,
                        CanManageBilling = model.CanManageBilling
                    };

                    _context.Secretaries.Add(secretary);
                    await _context.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetLawFirmSecretaries), new { id = id }, secretary);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error adding secretary to law firm with ID: {Id}", id);
                    throw; // Re-throw to be caught by the outer catch
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding secretary to law firm with ID: {Id}", id);
                return StatusCode(500, new { message = "An error occurred while adding the secretary" });
            }
        }

        // Helper methods
        private bool LawFirmExists(int id)
        {
            return _context.LawFirms.Any(e => e.LawFirmId == id);
        }
    }

    // Models
    public class LawFirmDetailsModel
    {
        public LawFirm LawFirm { get; set; }
        public IEnumerable<Lawyer> Lawyers { get; set; }
        public IEnumerable<Secretary> Secretaries { get; set; }
        public int ClientCount { get; set; }
        public int CaseCount { get; set; }
        public IEnumerable<Shared_Models.Clients.Client> RecentClients { get; set; }
        public IEnumerable<Shared_Models.Cases.Case> ActiveCases { get; set; }
    }

    public class LawFirmStatisticsModel
    {
        public int TotalCases { get; set; }
        public int ActiveCases { get; set; }
        public int ClosedCases { get; set; }
        public int TotalClients { get; set; }
        public int ActiveClients { get; set; }
        public int LawyerCount { get; set; }
        public int SecretaryCount { get; set; }
        public int UpcomingAppointments { get; set; }
        public int TotalDocuments { get; set; }
        public int TotalInvoices { get; set; }
        public int OutstandingInvoices { get; set; }
    }

    public class LawFirmCreationModel
    {
        [Required]
        [StringLength(100)]
        public string FirmName { get; set; }

        [StringLength(200)]
        public string FirmAddress { get; set; }

        [StringLength(20)]
        public string FirmPhone { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string FirmEmail { get; set; }

        [StringLength(100)]
        [Url]
        public string FirmWebsite { get; set; }

        [StringLength(50)]
        public string FirmTaxId { get; set; }

        public DateTime FoundedDate { get; set; }

        // Admin details
        [Required]
        [StringLength(50)]
        public string AdminUsername { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string AdminEmail { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string AdminPassword { get; set; }

        [Required]
        [StringLength(100)]
        public string AdminFirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string AdminLastName { get; set; }

        [StringLength(20)]
        public string AdminPhone { get; set; }
    }

    public class LawyerCreationModel
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [StringLength(50)]
        public string BarNumber { get; set; }

        [StringLength(100)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Biography { get; set; }

        [StringLength(500)]
        public string Specializations { get; set; }

        public decimal HourlyRate { get; set; }
    }

    public class SecretaryCreationModel
    {
        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public string Phone { get; set; }

        [StringLength(100)]
        public string Position { get; set; }

        public bool CanManageClients { get; set; } = true;
        public bool CanScheduleAppointments { get; set; } = true;
        public bool CanUploadDocuments { get; set; } = true;
        public bool CanManageBilling { get; set; } = false;
    }
}