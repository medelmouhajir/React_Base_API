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
    }
}