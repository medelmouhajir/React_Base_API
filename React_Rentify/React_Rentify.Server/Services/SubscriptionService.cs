using Microsoft.EntityFrameworkCore;
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

        private string GenerateInvoiceNumber()
        {
            var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
            var random = new Random().Next(1000, 9999);
            return $"SUB-{timestamp}-{random}";
        }
    }
}