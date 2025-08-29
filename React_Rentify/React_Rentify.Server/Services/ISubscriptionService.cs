using React_Rentify.Server.Controllers.App;
using React_Rentify.Server.Models.Subscriptions;

namespace React_Rentify.Server.Services
{
    public interface ISubscriptionService
    {
        // Plan management
        Task<IEnumerable<SubscriptionPlan>> GetAvailablePlansAsync();
        Task<SubscriptionPlan?> GetPlanByIdAsync(Guid planId);

        // Agency subscription management
        Task<AgencySubscription?> GetActiveSubscriptionAsync(Guid agencyId);
        Task<AgencySubscription> CreateSubscriptionAsync(Guid agencyId, Guid planId, bool startTrial = false);
        Task<AgencySubscription> UpgradeSubscriptionAsync(Guid agencyId, Guid newPlanId);
        Task<AgencySubscription> CancelSubscriptionAsync(Guid agencyId, DateTime? cancelDate = null);

        // Feature access validation
        Task<bool> HasFeatureAccessAsync(Guid agencyId, string featureName);
        Task<bool> IsWithinLimitsAsync(Guid agencyId, string resourceType, int currentCount);

        // Billing
        Task ProcessSubscriptionBillingAsync(Guid subscriptionId);
        Task<IEnumerable<SubscriptionInvoice>> GetSubscriptionInvoicesAsync(Guid agencyId);

        // Usage tracking
        Task RecordUsageAsync(Guid agencyId);
        Task<SubscriptionUsage?> GetCurrentUsageAsync(Guid agencyId);


        // Plan CRUD operations
        Task<SubscriptionPlan> CreatePlanAsync(CreatePlanDto dto);
        Task<SubscriptionPlan?> UpdatePlanAsync(Guid planId, UpdatePlanDto dto);
        Task<bool> DeactivatePlanAsync(Guid planId);
        Task<bool> ActivatePlanAsync(Guid planId);

        // Subscription management extensions
        Task<IEnumerable<AgencySubscription>> GetSubscriptionHistoryAsync(Guid agencyId);
        Task<AgencySubscription?> ResumeSubscriptionAsync(Guid agencyId);
        Task<AgencySubscription?> SuspendSubscriptionAsync(Guid agencyId, string reason);
        Task<AgencySubscription?> ChangeBillingCycleAsync(Guid agencyId, BillingCycle newBillingCycle);

        // Billing operations
        Task ProcessAllSubscriptionBillingAsync();
        Task<SubscriptionInvoice> CreateInvoiceAsync(Guid subscriptionId, decimal amount, string description);

        // Advanced feature management
        Task<Dictionary<string, bool>> GetAllFeatureAccessAsync(Guid agencyId);
        Task<Dictionary<string, (int current, int limit)>> GetAllResourceLimitsAsync(Guid agencyId);

        // Usage analytics
        Task<IEnumerable<SubscriptionUsage>> GetUsageHistoryAsync(Guid agencyId, int? year = null, int? month = null);
        Task UpdateUsageCountersAsync(Guid agencyId, string resourceType, int increment = 1);

        // Subscription validation
        Task<bool> ValidateSubscriptionStatusAsync(Guid agencyId);
        Task<IEnumerable<AgencySubscription>> GetExpiringSubscriptionsAsync(int daysAhead = 7);
        Task<IEnumerable<AgencySubscription>> GetOverdueSubscriptionsAsync();
    }
}