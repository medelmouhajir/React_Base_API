using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Expenses;
using React_Rentify.Server.Models.Subscriptions;
using React_Rentify.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AgencySetupController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly ILogger<AgencySetupController> _logger;

        public AgencySetupController(
            MainDbContext context,
            UserManager<User> userManager,
            RoleManager<IdentityRole> roleManager,
            ILogger<AgencySetupController> logger)
        {
            _context = context;
            _userManager = userManager;
            _roleManager = roleManager;
            _logger = logger;
        }

        /// <summary>
        /// POST: api/AgencySetup
        /// Creates a new agency with owner account and default expense categories
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateAgencyWithSetup([FromBody] CreateAgencySetupDto dto)
        {
            _logger.LogInformation("Starting agency setup for agency: {AgencyName}", dto.AgencyName);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateAgencySetupDto received");
                return BadRequest(ModelState);
            }

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Validate subscription plan exists
                var subscription = await _context.SubscriptionPlans.FindAsync(dto.SubscriptionPlanId);
                if (subscription == null)
                {
                    _logger.LogWarning("Subscription plan {SubscriptionPlanId} not found", dto.SubscriptionPlanId);
                    return BadRequest(new { message = $"Subscription plan '{dto.SubscriptionPlanId}' does not exist." });
                }

                // 2. Check if owner email already exists
                var existingUser = await _userManager.FindByEmailAsync(dto.AgencyEmail);
                if (existingUser != null)
                {
                    _logger.LogWarning("Owner email {Email} already exists", dto.AgencyEmail);
                    return Conflict(new { message = "Owner email is already registered." });
                }

                // 3. Create the agency
                var agencyId = Guid.NewGuid();
                var endDate = subscription.BillingCycle == BillingCycle.Monthly
                    ? DateTime.UtcNow.AddMonths(1)
                    : DateTime.UtcNow.AddYears(1);

                var sub = new AgencySubscription
                {
                    Id = new Guid(),
                    SubscriptionPlanId = dto.SubscriptionPlanId,
                    AgencyId = agencyId,
                    CreatedAt = DateTime.UtcNow,
                    StartDate = DateTime.UtcNow,
                    CurrentPrice = subscription.Price,
                    EndDate = endDate,
                    IsTrialPeriod = false,
                    UpdatedAt = DateTime.UtcNow,
                    LastBillingDate = DateTime.UtcNow,
                    NextBillingDate = endDate,
                    Status = SubscriptionStatus.Active,
                };

                var agency = new Agency
                {
                    Id = agencyId,
                    Name = dto.AgencyName,
                    Address = dto.AgencyAddress,
                    Email = dto.AgencyEmail,
                    PhoneOne = dto.AgencyPhoneOne,
                    PhoneTwo = dto.AgencyPhoneTwo,
                    Conditions = "و انا الموقع أسفله، أصرح أنني تسلمت مكتريا السيارة أعلاه، أعيدها على الحالة التي بقيت عليها طبقا لما هو مذكور من الشروط أسفله، \r\nخالبة، و التي استعملت عليها كاملة، و التي بإمكاني جيدا، و تسلمتها بكل الوثائق التي تخصها، و في حالة ضياع \r\nالكراء المذكور أعلاه.\r\n",
                    CurrentSubscription = sub,
                    LogoUrl = "",
                    
                };

                _context.Set<Agency>().Add(agency);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created agency {AgencyId} - {AgencyName}", agencyId, dto.AgencyName);



                // 4. Create the owner account
                var owner = new User
                {
                    UserName = dto.AgencyEmail,
                    Email = dto.AgencyEmail,
                    FullName = dto.OwnerFullName,
                    PhoneNumber = dto.AgencyPhoneOne,
                    Role = User_Role.Owner,
                    AgencyId = agencyId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    EmailConfirmed = true
                };

                var createResult = await _userManager.CreateAsync(owner, dto.OwnerPassword);
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning("Failed to create owner account for {Email}: {Errors}",
                        dto.AgencyEmail,
                        string.Join(", ", createResult.Errors.Select(e => e.Description)));

                    foreach (var error in createResult.Errors)
                    {
                        ModelState.AddModelError(string.Empty, error.Description);
                    }
                    await transaction.RollbackAsync();
                    return BadRequest(ModelState);
                }

                // Ensure Owner role exists
                if (!await _roleManager.RoleExistsAsync("Owner"))
                {
                    await _roleManager.CreateAsync(new IdentityRole("Owner"));
                }

                await _userManager.AddToRoleAsync(owner, "Owner");
                _logger.LogInformation("Created owner account {UserId} for agency {AgencyId}", owner.Id, agencyId);

                // 5. Create default expense categories
                var defaultCategories = GetDefaultExpenseCategories(agencyId);
                _context.Set<Expense_Category>().AddRange(defaultCategories);
                await _context.SaveChangesAsync();
                _logger.LogInformation("Created {Count} default expense categories for agency {AgencyId}",
                    defaultCategories.Count,
                    agencyId);

                // Commit transaction
                await transaction.CommitAsync();
                _logger.LogInformation("Successfully completed agency setup for {AgencyId}", agencyId);

                // Return response
                var response = new AgencySetupResponseDto
                {
                    AgencyId = agencyId,
                    AgencyName = agency.Name,
                    OwnerId = owner.Id,
                    OwnerEmail = owner.Email,
                    OwnerFullName = owner.FullName,
                    DefaultCategoriesCreated = defaultCategories.Count,
                    Categories = defaultCategories.Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        Name = c.Name
                    }).ToList()
                };

                return CreatedAtAction(
                    nameof(GetAgencySetup),
                    new { agencyId = agencyId },
                    response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during agency setup");
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = "An error occurred during agency setup.", error = ex.Message });
            }
        }

        /// <summary>
        /// GET: api/AgencySetup/{agencyId}
        /// Retrieves agency setup details including owner and categories
        /// </summary>
        [HttpGet("{agencyId:guid}")]
        public async Task<IActionResult> GetAgencySetup(Guid agencyId)
        {
            _logger.LogInformation("Retrieving agency setup for {AgencyId}", agencyId);

            var agency = await _context.Set<Agency>()
                .FirstOrDefaultAsync(a => a.Id == agencyId);

            if (agency == null)
            {
                _logger.LogWarning("Agency {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' not found." });
            }

            var owner = await _userManager.Users
                .FirstOrDefaultAsync(u => u.AgencyId == agencyId && u.Role == User_Role.Owner);

            var categories = await _context.Set<Expense_Category>()
                .Where(c => c.AgencyId == agencyId)
                .ToListAsync();

            var response = new AgencySetupResponseDto
            {
                AgencyId = agency.Id,
                AgencyName = agency.Name,
                OwnerId = owner?.Id,
                OwnerEmail = owner?.Email,
                OwnerFullName = owner?.FullName,
                DefaultCategoriesCreated = categories.Count,
                Categories = categories.Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name
                }).ToList()
            };

            return Ok(response);
        }

        /// <summary>
        /// Returns the default expense categories for a new agency
        /// </summary>
        private List<Expense_Category> GetDefaultExpenseCategories(Guid agencyId)
        {
            var defaultCategoryNames = new[]
            {
                "Électricité",
                "Loyer",
                "Insurance",
                "Nettoyage",
                "Autres"
            };

            return defaultCategoryNames.Select(name => new Expense_Category
            {
                Id = Guid.NewGuid(),
                Name = name,
                AgencyId = agencyId
            }).ToList();
        }

        // DTO Classes
        public class CreateAgencySetupDto
        {
            // Agency Information
            [Required]
            public string AgencyName { get; set; }

            [Required]
            public string AgencyAddress { get; set; }

            [Required]
            [EmailAddress]
            public string AgencyEmail { get; set; }

            [Required]
            public string AgencyPhoneOne { get; set; }

            public string? AgencyPhoneTwo { get; set; }

            [Required]
            public Guid SubscriptionPlanId { get; set; }

            // Owner Information
            [Required]
            public string OwnerFullName { get; set; }


            [Required]
            [StringLength(100, MinimumLength = 6)]
            public string OwnerPassword { get; set; }

        }

        public class AgencySetupResponseDto
        {
            public Guid AgencyId { get; set; }
            public string AgencyName { get; set; }
            public string? OwnerId { get; set; }
            public string? OwnerEmail { get; set; }
            public string? OwnerFullName { get; set; }
            public DateTime? SubscriptionEndDate { get; set; }
            public int DefaultCategoriesCreated { get; set; }
            public List<CategoryDto> Categories { get; set; }
        }

        public class CategoryDto
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
        }
    }
}