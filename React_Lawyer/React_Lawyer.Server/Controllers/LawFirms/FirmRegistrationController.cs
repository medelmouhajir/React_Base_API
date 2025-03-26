using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Firms;
using Shared_Models.Users;
using System.ComponentModel.DataAnnotations;
using System.Security.Cryptography;
using System.Text;

namespace React_Lawyer.Server.Controllers.Registration
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegistrationController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<RegistrationController> _logger;

        public RegistrationController(ApplicationDbContext context, ILogger<RegistrationController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Register a new law firm with admin account and optional staff
        /// </summary>
        /// <param name="model">Registration data including firm, admin, and optional staff</param>
        /// <returns>The created law firm with registration details</returns>
        [HttpPost("firm")]
        public async Task<ActionResult<FirmRegistrationResponseModel>> RegisterFirm(FirmRegistrationModel model)
        {
            try
            {
                _logger.LogInformation("Starting law firm registration process for {FirmName}", model.FirmName);

                // Validate model
                if (string.IsNullOrWhiteSpace(model.FirmName))
                {
                    return BadRequest(new { message = "Firm name is required" });
                }

                if (string.IsNullOrWhiteSpace(model.AdminUsername) ||
                    string.IsNullOrWhiteSpace(model.AdminEmail) ||
                    string.IsNullOrWhiteSpace(model.AdminPassword) ||
                    string.IsNullOrWhiteSpace(model.AdminFirstName) ||
                    string.IsNullOrWhiteSpace(model.AdminLastName))
                {
                    return BadRequest(new { message = "Complete admin details are required" });
                }

                // Check if usernames already exist
                var usernameExists = await _context.Users.AnyAsync(u => u.Username == model.AdminUsername);
                if (usernameExists)
                {
                    return BadRequest(new { message = "Admin username already exists" });
                }

                // Check any lawyer or secretary usernames
                if (model.Lawyers != null && model.Lawyers.Any())
                {
                    foreach (var lawyer in model.Lawyers)
                    {
                        var lawyerUsernameExists = await _context.Users.AnyAsync(u => u.Username == lawyer.Username);
                        if (lawyerUsernameExists)
                        {
                            return BadRequest(new { message = $"Lawyer username '{lawyer.Username}' already exists" });
                        }
                    }
                }

                if (model.Secretaries != null && model.Secretaries.Any())
                {
                    foreach (var secretary in model.Secretaries)
                    {
                        var secretaryUsernameExists = await _context.Users.AnyAsync(u => u.Username == secretary.Username);
                        if (secretaryUsernameExists)
                        {
                            return BadRequest(new { message = $"Secretary username '{secretary.Username}' already exists" });
                        }
                    }
                }

                // Check if emails already exist
                var emailExists = await _context.Users.AnyAsync(u => u.Email == model.AdminEmail);
                if (emailExists)
                {
                    return BadRequest(new { message = "Admin email already exists" });
                }

                // Check any lawyer or secretary emails
                if (model.Lawyers != null && model.Lawyers.Any())
                {
                    foreach (var lawyer in model.Lawyers)
                    {
                        var lawyerEmailExists = await _context.Users.AnyAsync(u => u.Email == lawyer.Email);
                        if (lawyerEmailExists)
                        {
                            return BadRequest(new { message = $"Lawyer email '{lawyer.Email}' already exists" });
                        }
                    }
                }

                if (model.Secretaries != null && model.Secretaries.Any())
                {
                    foreach (var secretary in model.Secretaries)
                    {
                        var secretaryEmailExists = await _context.Users.AnyAsync(u => u.Email == secretary.Email);
                        if (secretaryEmailExists)
                        {
                            return BadRequest(new { message = $"Secretary email '{secretary.Email}' already exists" });
                        }
                    }
                }

                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // Create admin user
                    var adminUser = new User
                    {
                        Username = model.AdminUsername,
                        Email = model.AdminEmail,
                        PasswordHash = HashPassword(model.AdminPassword),
                        FirstName = model.AdminFirstName,
                        LastName = model.AdminLastName,
                        PhoneNumber = model.AdminPhone,
                        Role = UserRole.Admin,
                        CreatedAt = DateTime.UtcNow,
                        IsActive = true
                    };

                    _context.Users.Add(adminUser);
                    await _context.SaveChangesAsync();

                    // Set subscription parameters
                    string subscriptionPlan = "Trial";
                    if (!string.IsNullOrWhiteSpace(model.SubscriptionPlan))
                    {
                        subscriptionPlan = model.SubscriptionPlan;
                    }

                    int subscriptionDuration = 2; // Default to 2 months for trial
                    if (model.SubscriptionDuration > 0)
                    {
                        subscriptionDuration = model.SubscriptionDuration;
                    }

                    // Create law firm
                    var lawFirm = new LawFirm
                    {
                        Name = model.FirmName,
                        Address = model.FirmAddress,
                        PhoneNumber = model.FirmPhone,
                        Email = model.FirmEmail,
                        Website = model.FirmWebsite,
                        TaxId = model.FirmTaxId,
                        FoundedDate = model.FoundedDate.HasValue ? DateTime.SpecifyKind(model.FoundedDate.Value, DateTimeKind.Utc) : DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        SubscriptionPlan = subscriptionPlan,
                        SubscriptionExpiryDate = DateTime.UtcNow.AddMonths(subscriptionDuration),
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

                    // Create lawyers if any
                    var createdLawyers = new List<Lawyer>();
                    if (model.Lawyers != null && model.Lawyers.Any())
                    {
                        foreach (var lawyerModel in model.Lawyers)
                        {
                            // Create user for lawyer
                            var lawyerUser = new User
                            {
                                Username = lawyerModel.Username,
                                Email = lawyerModel.Email,
                                PasswordHash = HashPassword(lawyerModel.Password),
                                FirstName = lawyerModel.FirstName,
                                LastName = lawyerModel.LastName,
                                PhoneNumber = lawyerModel.Phone,
                                Role = UserRole.Lawyer,
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true
                            };

                            _context.Users.Add(lawyerUser);
                            await _context.SaveChangesAsync();

                            // Create lawyer profile
                            var lawyer = new Lawyer
                            {
                                UserId = lawyerUser.UserId,
                                LawFirmId = lawFirm.LawFirmId,
                                BarNumber = lawyerModel.BarNumber,
                                Title = lawyerModel.Title,
                                Specializations = lawyerModel.Specializations,
                                HourlyRate = lawyerModel.HourlyRate,
                                JoinDate = DateTime.UtcNow,
                                Biography = ""
                            };

                            _context.Lawyers.Add(lawyer);
                            await _context.SaveChangesAsync();

                            createdLawyers.Add(lawyer);
                        }
                    }

                    // Create secretaries if any
                    var createdSecretaries = new List<Secretary>();
                    if (model.Secretaries != null && model.Secretaries.Any())
                    {
                        foreach (var secretaryModel in model.Secretaries)
                        {
                            // Create user for secretary
                            var secretaryUser = new User
                            {
                                Username = secretaryModel.Username,
                                Email = secretaryModel.Email,
                                PasswordHash = HashPassword(secretaryModel.Password),
                                FirstName = secretaryModel.FirstName,
                                LastName = secretaryModel.LastName,
                                PhoneNumber = secretaryModel.Phone,
                                Role = UserRole.Secretary,
                                CreatedAt = DateTime.UtcNow,
                                IsActive = true
                            };

                            _context.Users.Add(secretaryUser);
                            await _context.SaveChangesAsync();

                            // Create secretary profile
                            var secretary = new Secretary
                            {
                                UserId = secretaryUser.UserId,
                                LawFirmId = lawFirm.LawFirmId,
                                Position = secretaryModel.Position,
                                JoinDate = DateTime.UtcNow,
                                CanManageClients = secretaryModel.CanManageClients,
                                CanScheduleAppointments = secretaryModel.CanScheduleAppointments,
                                CanUploadDocuments = secretaryModel.CanUploadDocuments,
                                CanManageBilling = secretaryModel.CanManageBilling
                            };

                            _context.Secretaries.Add(secretary);
                            await _context.SaveChangesAsync();

                            createdSecretaries.Add(secretary);
                        }
                    }

                    await transaction.CommitAsync();

                    // Prepare response
                    var response = new FirmRegistrationResponseModel
                    {
                        LawFirm = lawFirm,
                        Admin = admin,
                        LawyerCount = createdLawyers.Count,
                        SecretaryCount = createdSecretaries.Count,
                        SubscriptionExpiryDate = lawFirm.SubscriptionExpiryDate
                    };

                    _logger.LogInformation("Successfully registered law firm {FirmName} with ID {FirmId}", lawFirm.Name, lawFirm.LawFirmId);
                    return Ok(response);
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error during law firm registration transaction");
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error registering law firm");
                return StatusCode(500, new { message = "An error occurred while registering the law firm", error = ex.Message });
            }
        }

        /// <summary>
        /// Check if a username is available
        /// </summary>
        /// <param name="username">Username to check</param>
        /// <returns>Availability status</returns>
        [HttpGet("checkUsername")]
        public async Task<ActionResult<UsernameAvailabilityResult>> CheckUsernameAvailability([FromQuery] string username)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username))
                {
                    return BadRequest(new { message = "Username is required" });
                }

                var exists = await _context.Users.AnyAsync(u => u.Username == username);
                return Ok(new UsernameAvailabilityResult { IsAvailable = !exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking username availability");
                return StatusCode(500, new { message = "An error occurred while checking username availability" });
            }
        }

        /// <summary>
        /// Check if an email is available
        /// </summary>
        /// <param name="email">Email to check</param>
        /// <returns>Availability status</returns>
        [HttpGet("checkEmail")]
        public async Task<ActionResult<EmailAvailabilityResult>> CheckEmailAvailability([FromQuery] string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new { message = "Email is required" });
                }

                var exists = await _context.Users.AnyAsync(u => u.Email == email);
                return Ok(new EmailAvailabilityResult { IsAvailable = !exists });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking email availability");
                return StatusCode(500, new { message = "An error occurred while checking email availability" });
            }
        }

        /// <summary>
        /// Get available subscription plans
        /// </summary>
        /// <returns>List of subscription plans</returns>
        [HttpGet("subscriptionPlans")]
        public ActionResult<IEnumerable<SubscriptionPlanModel>> GetSubscriptionPlans()
        {
            try
            {
                // In a real application, these would come from a database
                var plans = new List<SubscriptionPlanModel>
                {
                    new SubscriptionPlanModel
                    {
                        Name = "Trial",
                        Description = "Free 2-month trial with basic features",
                        DurationMonths = 2,
                        Price = 0,
                        Features = new List<string>
                        {
                            "Up to 5 users",
                            "Basic case management",
                            "Client management",
                            "Basic document storage",
                            "Email support"
                        }
                    },
                    new SubscriptionPlanModel
                    {
                        Name = "Basic",
                        Description = "Essential features for small law firms",
                        DurationMonths = 12,
                        Price = 99.99m,
                        Features = new List<string>
                        {
                            "Up to 10 users",
                            "Advanced case management",
                            "Client management",
                            "10GB document storage",
                            "Basic billing and invoicing",
                            "Priority email support"
                        }
                    },
                    new SubscriptionPlanModel
                    {
                        Name = "Professional",
                        Description = "Complete solution for medium-sized law firms",
                        DurationMonths = 12,
                        Price = 199.99m,
                        Features = new List<string>
                        {
                            "Unlimited users",
                            "Advanced case management",
                            "Client management with CRM",
                            "50GB document storage",
                            "Advanced billing and invoicing",
                            "Custom reports",
                            "Priority phone and email support"
                        }
                    }
                };

                return Ok(plans);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving subscription plans");
                return StatusCode(500, new { message = "An error occurred while retrieving subscription plans" });
            }
        }

        #region Helper Methods

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        #endregion
    }

    #region Models

    public class FirmRegistrationModel
    {
        // Firm details
        [Required]
        public string FirmName { get; set; }
        public string FirmAddress { get; set; }
        public string FirmPhone { get; set; }
        [Required]
        [EmailAddress]
        public string FirmEmail { get; set; }
        public string FirmWebsite { get; set; }
        public string FirmTaxId { get; set; }
        public DateTime? FoundedDate { get; set; }

        // Admin details
        [Required]
        public string AdminUsername { get; set; }
        [Required]
        [EmailAddress]
        public string AdminEmail { get; set; }
        [Required]
        public string AdminPassword { get; set; }
        [Required]
        public string AdminFirstName { get; set; }
        [Required]
        public string AdminLastName { get; set; }
        public string AdminPhone { get; set; }

        // Subscription
        public string SubscriptionPlan { get; set; } = "Trial";
        public int SubscriptionDuration { get; set; } = 2; // 2 months by default

        // Staff members
        public List<LawyerRegistrationModel> Lawyers { get; set; }
        public List<SecretaryRegistrationModel> Secretaries { get; set; }
    }

    public class LawyerRegistrationModel
    {
        [Required]
        public string Username { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        public string Phone { get; set; }
        public string BarNumber { get; set; }
        public string Title { get; set; }
        public string Specializations { get; set; }
        public decimal HourlyRate { get; set; } = 150;
    }

    public class SecretaryRegistrationModel
    {
        [Required]
        public string Username { get; set; }
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        [Required]
        public string Password { get; set; }
        [Required]
        public string FirstName { get; set; }
        [Required]
        public string LastName { get; set; }
        public string Phone { get; set; }
        public string Position { get; set; }
        public bool CanManageClients { get; set; } = true;
        public bool CanScheduleAppointments { get; set; } = true;
        public bool CanUploadDocuments { get; set; } = true;
        public bool CanManageBilling { get; set; } = false;
    }

    public class FirmRegistrationResponseModel
    {
        public LawFirm LawFirm { get; set; }
        public Admin Admin { get; set; }
        public int LawyerCount { get; set; }
        public int SecretaryCount { get; set; }
        public DateTime? SubscriptionExpiryDate { get; set; }
    }

    public class UsernameAvailabilityResult
    {
        public bool IsAvailable { get; set; }
    }

    public class EmailAvailabilityResult
    {
        public bool IsAvailable { get; set; }
    }

    public class SubscriptionPlanModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public int DurationMonths { get; set; }
        public decimal Price { get; set; }
        public List<string> Features { get; set; }
    }

    #endregion
}