using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Controllers.App;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Subscriptions;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Services
{
    public class SubscriptionService : ISubscriptionService
    {
        private readonly MainDbContext _context;
        private readonly ILogger<SubscriptionService> _logger;

        public SubscriptionService(MainDbContext context, ILogger<SubscriptionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<SubscriptionPlan>> GetAvailablePlansAsync()
        {
            return await _context.Set<SubscriptionPlan>()
                .Where(p => p.IsActive)
                .OrderBy(p => p.Price)
                .ToListAsync();
        }

        public async Task<SubscriptionPlan?> GetPlanByIdAsync(Guid planId)
        {
            return await _context.Set<SubscriptionPlan>()
                .FirstOrDefaultAsync(p => p.Id == planId && p.IsActive);
        }

        public async Task<AgencySubscription?> GetActiveSubscriptionAsync(Guid agencyId)
        {
            return await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .Where(s => s.AgencyId == agencyId &&
                           (s.Status == SubscriptionStatus.Active ||
                            s.Status == SubscriptionStatus.Trial))
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<AgencySubscription> CreateSubscriptionAsync(Guid agencyId, Guid planId, bool startTrial = false)
        {
            var plan = await GetPlanByIdAsync(planId);
            if (plan == null) throw new ArgumentException("Invalid subscription plan");

            // Cancel any existing active subscription
            var existingSubscription = await GetActiveSubscriptionAsync(agencyId);
            if (existingSubscription != null)
            {
                existingSubscription.Status = SubscriptionStatus.Cancelled;
                existingSubscription.CancelledAt = DateTime.UtcNow;
                existingSubscription.UpdatedAt = DateTime.UtcNow;
            }

            var subscription = new AgencySubscription
            {
                Id = Guid.NewGuid(),
                AgencyId = agencyId,
                SubscriptionPlanId = planId,
                Status = startTrial ? SubscriptionStatus.Trial : SubscriptionStatus.Active,
                StartDate = DateTime.UtcNow,
                EndDate = CalculateEndDate(DateTime.UtcNow, plan.BillingCycle),
                CurrentPrice = plan.Price,
                NextBillingDate = startTrial ? DateTime.UtcNow.AddDays(14) : CalculateNextBillingDate(DateTime.UtcNow, plan.BillingCycle),
                LastBillingDate = DateTime.UtcNow,
                IsTrialPeriod = startTrial,
                TrialEndDate = startTrial ? DateTime.UtcNow.AddDays(14) : null,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<AgencySubscription>().Add(subscription);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created subscription {SubscriptionId} for agency {AgencyId}", subscription.Id, agencyId);
            return subscription;
        }

        public async Task<AgencySubscription> UpgradeSubscriptionAsync(Guid agencyId, Guid newPlanId)
        {
            var currentSubscription = await GetActiveSubscriptionAsync(agencyId);
            if (currentSubscription == null)
                throw new InvalidOperationException("No active subscription found");

            var newPlan = await GetPlanByIdAsync(newPlanId);
            if (newPlan == null)
                throw new ArgumentException("Invalid subscription plan");

            // Update current subscription
            currentSubscription.SubscriptionPlanId = newPlanId;
            currentSubscription.CurrentPrice = newPlan.Price;
            currentSubscription.UpdatedAt = DateTime.UtcNow;

            // If upgrading from trial, end trial period
            if (currentSubscription.IsTrialPeriod && newPlan.Price > 0)
            {
                currentSubscription.IsTrialPeriod = false;
                currentSubscription.TrialEndDate = DateTime.UtcNow;
                currentSubscription.Status = SubscriptionStatus.Active;
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Upgraded subscription {SubscriptionId} to plan {PlanId}", currentSubscription.Id, newPlanId);
            return currentSubscription;
        }

        public async Task<AgencySubscription> CancelSubscriptionAsync(Guid agencyId, DateTime? cancelDate = null)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null)
                throw new InvalidOperationException("No active subscription found");

            subscription.Status = SubscriptionStatus.Cancelled;
            subscription.CancelledAt = cancelDate ?? DateTime.UtcNow;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Cancelled subscription {SubscriptionId} for agency {AgencyId}", subscription.Id, agencyId);
            return subscription;
        }

        public async Task<bool> HasFeatureAccessAsync(Guid agencyId, string featureName)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return false;

            var plan = subscription.SubscriptionPlan;
            return featureName switch
            {
                "MaintenanceModule" => plan.HasMaintenanceModule,
                "ExpenseTracking" => plan.HasExpenseTracking,
                "AdvancedReporting" => plan.HasAdvancedReporting,
                "APIAccess" => plan.HasAPIAccess,
                "GPSTracking" => plan.HasGPSTracking,
                _ => false
            };
        }

        public async Task<bool> IsWithinLimitsAsync(Guid agencyId, string resourceType, int currentCount)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return false;

            var plan = subscription.SubscriptionPlan;
            return resourceType switch
            {
                "cars" => currentCount < plan.MaxCars,
                "users" => currentCount < plan.MaxUsers,
                "customers" => currentCount < plan.MaxCustomers,
                _ => true
            };
        }

        public async Task ProcessSubscriptionBillingAsync(Guid subscriptionId)
        {
            var subscription = await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .FirstOrDefaultAsync(s => s.Id == subscriptionId);

            if (subscription == null || subscription.Status != SubscriptionStatus.Active)
                return;

            // Check if billing is due
            if (DateTime.UtcNow < subscription.NextBillingDate)
                return;

            var invoice = new SubscriptionInvoice
            {
                Id = Guid.NewGuid(),
                AgencySubscriptionId = subscriptionId,
                InvoiceNumber = GenerateInvoiceNumber(),
                BillingPeriodStart = subscription.LastBillingDate,
                BillingPeriodEnd = subscription.NextBillingDate,
                IssueDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Amount = subscription.CurrentPrice,
                TaxAmount = subscription.CurrentPrice * 0.20m, // 20% VAT
                TotalAmount = subscription.CurrentPrice * 1.20m,
                Status = SubscriptionInvoiceStatus.Sent,
                Currency = "MAD",
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<SubscriptionInvoice>().Add(invoice);

            // Update subscription billing dates
            subscription.LastBillingDate = subscription.NextBillingDate;
            subscription.NextBillingDate = CalculateNextBillingDate(subscription.NextBillingDate, subscription.SubscriptionPlan.BillingCycle);
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Created billing invoice {InvoiceId} for subscription {SubscriptionId}", invoice.Id, subscriptionId);
        }

        public async Task<IEnumerable<SubscriptionInvoice>> GetSubscriptionInvoicesAsync(Guid agencyId)
        {
            return await _context.Set<SubscriptionInvoice>()
                .Include(i => i.AgencySubscription)
                .Where(i => i.AgencySubscription.AgencyId == agencyId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();
        }

        public async Task RecordUsageAsync(Guid agencyId)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return;

            var now = DateTime.UtcNow;
            var year = now.Year;
            var month = now.Month;

            // Get or create usage record for current month
            var usage = await _context.Set<SubscriptionUsage>()
                .FirstOrDefaultAsync(u => u.AgencySubscriptionId == subscription.Id &&
                                         u.Year == year && u.Month == month);

            if (usage == null)
            {
                usage = new SubscriptionUsage
                {
                    Id = Guid.NewGuid(),
                    AgencySubscriptionId = subscription.Id,
                    Year = year,
                    Month = month,
                    RecordedAt = DateTime.UtcNow
                };
                _context.Set<SubscriptionUsage>().Add(usage);
            }

            // Update usage counters
            usage.CarsCount = await _context.Set<Car>().CountAsync(c => c.AgencyId == agencyId);
            usage.UsersCount = await _context.Set<User>().CountAsync(u => u.AgencyId == agencyId);
            usage.CustomersCount = await _context.Set<Customer>().CountAsync(c => c.AgencyId == agencyId);
            usage.ReservationsCount = await _context.Set<Reservation>()
                .CountAsync(r => r.AgencyId == agencyId &&
                               r.StartDate.Year == year &&
                               r.StartDate.Month == month);
            usage.RecordedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<SubscriptionUsage?> GetCurrentUsageAsync(Guid agencyId)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return null;

            var now = DateTime.UtcNow;
            return await _context.Set<SubscriptionUsage>()
                .FirstOrDefaultAsync(u => u.AgencySubscriptionId == subscription.Id &&
                                         u.Year == now.Year &&
                                         u.Month == now.Month);
        }

        private DateTime CalculateEndDate(DateTime startDate, BillingCycle cycle)
        {
            return cycle == BillingCycle.Monthly
                ? startDate.AddMonths(1)
                : startDate.AddYears(1);
        }

        private DateTime CalculateNextBillingDate(DateTime startDate, BillingCycle cycle)
        {
            return cycle == BillingCycle.Monthly
                ? startDate.AddMonths(1)
                : startDate.AddYears(1);
        }

        public async Task<SubscriptionPlan> CreatePlanAsync(CreatePlanDto dto)
        {
            var plan = new SubscriptionPlan
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                BillingCycle = dto.BillingCycle,
                MaxCars = dto.MaxCars,
                MaxUsers = dto.MaxUsers,
                MaxCustomers = dto.MaxCustomers,
                MaxReservations = dto.MaxReservations,
                HasMaintenanceModule = dto.HasMaintenanceModule,
                HasExpenseTracking = dto.HasExpenseTracking,
                HasAdvancedReporting = dto.HasAdvancedReporting,
                HasAPIAccess = dto.HasAPIAccess,
                HasGPSTracking = dto.HasGPSTracking,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Set<SubscriptionPlan>().Add(plan);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created subscription plan {PlanId} with name {PlanName}", plan.Id, plan.Name);
            return plan;
        }

        public async Task<SubscriptionPlan?> UpdatePlanAsync(Guid planId, UpdatePlanDto dto)
        {
            var plan = await _context.Set<SubscriptionPlan>()
                .FirstOrDefaultAsync(p => p.Id == planId);

            if (plan == null) return null;

            // Update only provided fields
            if (dto.Name != null) plan.Name = dto.Name;
            if (dto.Description != null) plan.Description = dto.Description;
            if (dto.Price.HasValue) plan.Price = dto.Price.Value;
            if (dto.BillingCycle.HasValue) plan.BillingCycle = dto.BillingCycle.Value;
            if (dto.MaxCars.HasValue) plan.MaxCars = dto.MaxCars.Value;
            if (dto.MaxUsers.HasValue) plan.MaxUsers = dto.MaxUsers.Value;
            if (dto.MaxCustomers.HasValue) plan.MaxCustomers = dto.MaxCustomers.Value;
            if (dto.MaxReservations.HasValue) plan.MaxReservations = dto.MaxReservations.Value;
            if (dto.HasMaintenanceModule.HasValue) plan.HasMaintenanceModule = dto.HasMaintenanceModule.Value;
            if (dto.HasExpenseTracking.HasValue) plan.HasExpenseTracking = dto.HasExpenseTracking.Value;
            if (dto.HasAdvancedReporting.HasValue) plan.HasAdvancedReporting = dto.HasAdvancedReporting.Value;
            if (dto.HasAPIAccess.HasValue) plan.HasAPIAccess = dto.HasAPIAccess.Value;
            if (dto.HasGPSTracking.HasValue) plan.HasGPSTracking = dto.HasGPSTracking.Value;

            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated subscription plan {PlanId}", planId);
            return plan;
        }

        public async Task<bool> DeactivatePlanAsync(Guid planId)
        {
            var plan = await _context.Set<SubscriptionPlan>()
                .FirstOrDefaultAsync(p => p.Id == planId);

            if (plan == null) return false;

            plan.IsActive = false;
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Deactivated subscription plan {PlanId}", planId);
            return true;
        }

        public async Task<bool> ActivatePlanAsync(Guid planId)
        {
            var plan = await _context.Set<SubscriptionPlan>()
                .FirstOrDefaultAsync(p => p.Id == planId);

            if (plan == null) return false;

            plan.IsActive = true;
            plan.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Activated subscription plan {PlanId}", planId);
            return true;
        }

        public async Task<IEnumerable<AgencySubscription>> GetSubscriptionHistoryAsync(Guid agencyId)
        {
            return await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .Where(s => s.AgencyId == agencyId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();
        }

        public async Task<AgencySubscription?> ResumeSubscriptionAsync(Guid agencyId)
        {
            var subscription = await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .Where(s => s.AgencyId == agencyId &&
                           (s.Status == SubscriptionStatus.Suspended || s.Status == SubscriptionStatus.Cancelled))
                .OrderByDescending(s => s.CreatedAt)
                .FirstOrDefaultAsync();

            if (subscription == null) return null;

            subscription.Status = SubscriptionStatus.Active;
            subscription.UpdatedAt = DateTime.UtcNow;
            subscription.CancelledAt = null;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Resumed subscription {SubscriptionId} for agency {AgencyId}", subscription.Id, agencyId);
            return subscription;
        }

        public async Task<AgencySubscription?> SuspendSubscriptionAsync(Guid agencyId, string reason)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return null;

            subscription.Status = SubscriptionStatus.Suspended;
            subscription.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Suspended subscription {SubscriptionId} for agency {AgencyId}. Reason: {Reason}",
                subscription.Id, agencyId, reason);
            return subscription;
        }

        public async Task<AgencySubscription?> ChangeBillingCycleAsync(Guid agencyId, BillingCycle newBillingCycle)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return null;

            var plan = await GetPlanByIdAsync(subscription.SubscriptionPlanId);
            if (plan == null) return null;

            // Create a new plan with the same features but different billing cycle
            var newPlan = await _context.Set<SubscriptionPlan>()
                .FirstOrDefaultAsync(p => p.Name == plan.Name &&
                                         p.BillingCycle == newBillingCycle &&
                                         p.IsActive);

            if (newPlan != null)
            {
                subscription.SubscriptionPlanId = newPlan.Id;
                subscription.CurrentPrice = newPlan.Price;
                subscription.NextBillingDate = CalculateNextBillingDate(DateTime.UtcNow, newBillingCycle);
                subscription.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Changed billing cycle for subscription {SubscriptionId} to {BillingCycle}",
                    subscription.Id, newBillingCycle);
                return subscription;
            }

            return null;
        }

        public async Task ProcessAllSubscriptionBillingAsync()
        {
            var dueBillings = await _context.Set<AgencySubscription>()
                .Where(s => s.Status == SubscriptionStatus.Active &&
                           s.NextBillingDate <= DateTime.UtcNow)
                .ToListAsync();

            foreach (var subscription in dueBillings)
            {
                try
                {
                    await ProcessSubscriptionBillingAsync(subscription.Id);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to process billing for subscription {SubscriptionId}", subscription.Id);
                }
            }

            _logger.LogInformation("Processed billing for {Count} subscriptions", dueBillings.Count);
        }

        public async Task<SubscriptionInvoice> CreateInvoiceAsync(Guid subscriptionId, decimal amount, string description)
        {
            var invoice = new SubscriptionInvoice
            {
                Id = Guid.NewGuid(),
                AgencySubscriptionId = subscriptionId,
                Amount = amount,
                //Description = description,
                IssueDate = DateTime.UtcNow,
                DueDate = DateTime.UtcNow.AddDays(30),
                Status = SubscriptionInvoiceStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<SubscriptionInvoice>().Add(invoice);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created invoice {InvoiceId} for subscription {SubscriptionId}", invoice.Id, subscriptionId);
            return invoice;
        }

        public async Task<Dictionary<string, bool>> GetAllFeatureAccessAsync(Guid agencyId)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription?.SubscriptionPlan == null)
            {
                return new Dictionary<string, bool>
                {
                    ["MaintenanceModule"] = false,
                    ["ExpenseTracking"] = false,
                    ["AdvancedReporting"] = false,
                    ["APIAccess"] = false,
                    ["GPSTracking"] = false
                };
            }

            return new Dictionary<string, bool>
            {
                ["MaintenanceModule"] = subscription.SubscriptionPlan.HasMaintenanceModule,
                ["ExpenseTracking"] = subscription.SubscriptionPlan.HasExpenseTracking,
                ["AdvancedReporting"] = subscription.SubscriptionPlan.HasAdvancedReporting,
                ["APIAccess"] = subscription.SubscriptionPlan.HasAPIAccess,
                ["GPSTracking"] = subscription.SubscriptionPlan.HasGPSTracking
            };
        }

        public async Task<Dictionary<string, (int current, int limit)>> GetAllResourceLimitsAsync(Guid agencyId)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription?.SubscriptionPlan == null)
            {
                return new Dictionary<string, (int current, int limit)>();
            }

            // Get current counts (you'll need to implement these queries based on your models)
            var carCount = await _context.Set<Car>().CountAsync(c => c.AgencyId == agencyId);
            var userCount = await _context.Set<User>().CountAsync(u => u.AgencyId == agencyId);
            var customerCount = await _context.Set<Customer>().CountAsync(c => c.AgencyId == agencyId);

            var currentMonth = DateTime.UtcNow.Month;
            var currentYear = DateTime.UtcNow.Year;
            var reservationCount = await _context.Set<Reservation>()
                .CountAsync(r => r.AgencyId == agencyId &&
                                r.StartDate.Month == currentMonth &&
                                r.StartDate.Year == currentYear);

            return new Dictionary<string, (int current, int limit)>
            {
                ["Cars"] = (carCount, subscription.SubscriptionPlan.MaxCars),
                ["Users"] = (userCount, subscription.SubscriptionPlan.MaxUsers),
                ["Customers"] = (customerCount, subscription.SubscriptionPlan.MaxCustomers),
                ["Reservations"] = (reservationCount, subscription.SubscriptionPlan.MaxReservations)
            };
        }

        public async Task<IEnumerable<SubscriptionUsage>> GetUsageHistoryAsync(Guid agencyId, int? year = null, int? month = null)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return new List<SubscriptionUsage>();

            var query = _context.Set<SubscriptionUsage>()
                .Where(u => u.AgencySubscriptionId == subscription.Id);

            if (year.HasValue)
                query = query.Where(u => u.Year == year.Value);

            if (month.HasValue)
                query = query.Where(u => u.Month == month.Value);

            return await query.OrderByDescending(u => u.Year)
                             .ThenByDescending(u => u.Month)
                             .ToListAsync();
        }

        public async Task UpdateUsageCountersAsync(Guid agencyId, string resourceType, int increment = 1)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return;

            var now = DateTime.UtcNow;
            var usage = await _context.Set<SubscriptionUsage>()
                .FirstOrDefaultAsync(u => u.AgencySubscriptionId == subscription.Id &&
                                         u.Year == now.Year && u.Month == now.Month);

            if (usage == null)
            {
                usage = new SubscriptionUsage
                {
                    Id = Guid.NewGuid(),
                    AgencySubscriptionId = subscription.Id,
                    Year = now.Year,
                    Month = now.Month,
                    CarsCount = 0,
                    UsersCount = 0,
                    CustomersCount = 0,
                    ReservationsCount = 0,
                    //CreatedAt = DateTime.UtcNow,
                    //UpdatedAt = DateTime.UtcNow
                };
                _context.Set<SubscriptionUsage>().Add(usage);
            }

            // Update the specific counter
            switch (resourceType.ToLower())
            {
                case "cars":
                    usage.CarsCount += increment;
                    break;
                case "users":
                    usage.UsersCount += increment;
                    break;
                case "customers":
                    usage.CustomersCount += increment;
                    break;
                case "reservations":
                    usage.ReservationsCount += increment;
                    break;
            }

            //usage.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<bool> ValidateSubscriptionStatusAsync(Guid agencyId)
        {
            var subscription = await GetActiveSubscriptionAsync(agencyId);
            if (subscription == null) return false;

            // Check if trial has expired
            if (subscription.IsTrialPeriod && subscription.TrialEndDate.HasValue &&
                subscription.TrialEndDate.Value < DateTime.UtcNow)
            {
                subscription.Status = SubscriptionStatus.Expired;
                subscription.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return false;
            }

            // Check if subscription has expired
            if (subscription.EndDate < DateTime.UtcNow)
            {
                subscription.Status = SubscriptionStatus.Expired;
                subscription.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                return false;
            }

            return subscription.Status == SubscriptionStatus.Active || subscription.Status == SubscriptionStatus.Trial;
        }

        public async Task<IEnumerable<AgencySubscription>> GetExpiringSubscriptionsAsync(int daysAhead = 7)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(daysAhead);

            return await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .Include(s => s.Agency)
                .Where(s => (s.Status == SubscriptionStatus.Active || s.Status == SubscriptionStatus.Trial) &&
                           s.EndDate <= cutoffDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<AgencySubscription>> GetOverdueSubscriptionsAsync()
        {
            var now = DateTime.UtcNow;

            return await _context.Set<AgencySubscription>()
                .Include(s => s.SubscriptionPlan)
                .Include(s => s.Agency)
                .Where(s => s.Status == SubscriptionStatus.Active &&
                           s.NextBillingDate < now.AddDays(-7)) // 7 days past due
                .ToListAsync();
        }

        private string GenerateInvoiceNumber()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
            var random = new Random().Next(1000, 9999);
            return $"SUB-{timestamp}-{random}";
        }
    }
}