using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Firms;
using Shared_Models.Users;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LawFirmsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<LawFirmsController> _logger;

        public LawFirmsController(ApplicationDbContext context, ILogger<LawFirmsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/LawFirms
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LawFirm>>> GetLawFirms()
        {
            return await _context.LawFirms
                .Where(f => f.IsActive)
                .ToListAsync();
        }

        // GET: api/LawFirms/5
        [HttpGet("{id}")]
        public async Task<ActionResult<LawFirm>> GetLawFirm(int id)
        {
            var lawFirm = await _context.LawFirms
                .FirstOrDefaultAsync(f => f.LawFirmId == id);

            if (lawFirm == null)
            {
                return NotFound();
            }

            return lawFirm;
        }

        // GET: api/LawFirms/5/Secretaries
        [HttpGet("{id}/Secretaries")]
        public async Task<ActionResult<IEnumerable<Secretary>>> GetLawFirmSecretaries(int id)
        {
            return await _context.Secretaries
                .Include(s => s.User)
                .Where(s => s.LawFirmId == id && s.User.IsActive)
                .ToListAsync();
        }

        // GET: api/LawFirms/5/Clients
        [HttpGet("{id}/Clients")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Clients.Client>>> GetLawFirmClients(int id)
        {
            return await _context.Clients
                .Where(c => c.LawFirmId == id && c.IsActive)
                .ToListAsync();
        }

        // GET: api/LawFirms/5/Cases
        [HttpGet("{id}/Cases")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Cases.Case>>> GetLawFirmCases(int id)
        {
            return await _context.Cases
                .Where(c => c.LawFirmId == id)
                .ToListAsync();
        }

        // POST: api/LawFirms/5/Lawyers
        [HttpPost("{id}/Lawyers")]
        public async Task<ActionResult<Lawyer>> AddLawyer(int id, LawyerCreationModel model)
        {
            var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id && f.IsActive);
            if (!lawFirmExists)
            {
                return NotFound("Law firm not found");
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

                return CreatedAtAction("GetLawFirmLawyers", new { id = id }, lawyer);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding lawyer to law firm");
                return StatusCode(500, "An error occurred while adding the lawyer.");
            }
        }

        // POST: api/LawFirms/5/Secretaries
        [HttpPost("{id}/Secretaries")]
        public async Task<ActionResult<Secretary>> AddSecretary(int id, SecretaryCreationModel model)
        {
            var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id && f.IsActive);
            if (!lawFirmExists)
            {
                return NotFound("Law firm not found");
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

                return CreatedAtAction("GetLawFirmSecretaries", new { id = id }, secretary);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error adding secretary to law firm");
                return StatusCode(500, "An error occurred while adding the secretary.");
            }
        }

        // GET: api/LawFirms/5/Statistics
        [HttpGet("{id}/Statistics")]
        public async Task<ActionResult<LawFirmStatisticsModel>> GetLawFirmStatistics(int id)
        {
            var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == id);
            if (!lawFirmExists)
            {
                return NotFound("Law firm not found");
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

        private bool LawFirmExists(int id)
        {
            return _context.LawFirms.Any(e => e.LawFirmId == id);
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
            // Firm details
            public string FirmName { get; set; }
            public string FirmAddress { get; set; }
            public string FirmPhone { get; set; }
            public string FirmEmail { get; set; }
            public string FirmWebsite { get; set; }
            public string FirmTaxId { get; set; }
            public DateTime FoundedDate { get; set; }

            // Admin details
            public string AdminUsername { get; set; }
            public string AdminEmail { get; set; }
            public string AdminPassword { get; set; }
            public string AdminFirstName { get; set; }
            public string AdminLastName { get; set; }
            public string AdminPhone { get; set; }
        }

        public class LawyerCreationModel
        {
            public string Username { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Phone { get; set; }
            public string BarNumber { get; set; }
            public string Title { get; set; }
            public string Biography { get; set; }
            public string Specializations { get; set; }
            public decimal HourlyRate { get; set; }
        }

        public class SecretaryCreationModel
        {
            public string Username { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
            public string FirstName { get; set; }
            public string LastName { get; set; }
            public string Phone { get; set; }
            public string Position { get; set; }
            public bool CanManageClients { get; set; } = true;
            public bool CanScheduleAppointments { get; set; } = true;
            public bool CanUploadDocuments { get; set; } = true;
            public bool CanManageBilling { get; set; } = false;
        }

        [HttpGet("{id}/Details")]
        public async Task<ActionResult<LawFirmDetailsModel>> GetLawFirmDetails(int id)
        {
            var lawFirm = await _context.LawFirms
                .FirstOrDefaultAsync(f => f.LawFirmId == id);

            if (lawFirm == null)
            {
                return NotFound();
            }

            var lawyers = await _context.Lawyers
                .Where(l => l.LawFirmId == id)
                .Include(l => l.User)
                .ToListAsync();

            var secretaries = await _context.Secretaries
                .Where(s => s.LawFirmId == id)
                .Include(s => s.User)
                .ToListAsync();

            var clientCount = await _context.Clients
                .CountAsync(c => c.LawFirmId == id && c.IsActive);

            var caseCount = await _context.Cases
                .CountAsync(c => c.LawFirmId == id);

            var activeClients = await _context.Clients
                .Where(c => c.LawFirmId == id && c.IsActive)
                .Take(5)
                .ToListAsync();

            var activeCases = await _context.Cases
                .Where(c => c.LawFirmId == id &&
                           (c.Status != Shared_Models.Cases.CaseStatus.Closed &&
                            c.Status != Shared_Models.Cases.CaseStatus.Archived))
                .Take(5)
                .ToListAsync();

            var result = new LawFirmDetailsModel
            {
                LawFirm = lawFirm,
                Lawyers = lawyers,
                Secretaries = secretaries,
                ClientCount = clientCount,
                CaseCount = caseCount,
                RecentClients = activeClients,
                ActiveCases = activeCases
            };

            return result;
        }

        // POST: api/LawFirms
        [HttpPost]
        public async Task<ActionResult<LawFirm>> CreateLawFirm(LawFirmCreationModel model)
        {
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
                return StatusCode(500, "An error occurred while creating the law firm.");
            }
        }

        // PUT: api/LawFirms/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLawFirm(int id, LawFirm lawFirm)
        {
            if (id != lawFirm.LawFirmId)
            {
                return BadRequest();
            }

            _context.Entry(lawFirm).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!LawFirmExists(id))
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

        // DELETE: api/LawFirms/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLawFirm(int id)
        {
            var lawFirm = await _context.LawFirms.FindAsync(id);
            if (lawFirm == null)
            {
                return NotFound();
            }

            // Instead of deleting, deactivate
            lawFirm.IsActive = false;
            _context.Entry(lawFirm).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/LawFirms/5/Lawyers
        [HttpGet("{id}/Lawyers")]
        public async Task<ActionResult<IEnumerable<Lawyer>>> GetLawFirmLawyers(int id)
        {
            return await _context.Lawyers
                .Include(l => l.User)
                .Where(l => l.LawFirmId == id && l.User.IsActive)
                .ToListAsync();
        }

    }
}