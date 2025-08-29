using React_Rentify.Server.Models.Agencies;

namespace React_Rentify.Server.Models.Subscriptions
{
    public class AgencySubscription
    {
        public Guid Id { get; set; }

        public Guid AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }

        public Guid SubscriptionPlanId { get; set; }
        public virtual SubscriptionPlan? SubscriptionPlan { get; set; }

        public SubscriptionStatus Status { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public DateTime? CancelledAt { get; set; }

        // Billing
        public decimal CurrentPrice { get; set; } // Store price at subscription time
        public DateTime NextBillingDate { get; set; }
        public DateTime LastBillingDate { get; set; }

        // Trial period
        public bool IsTrialPeriod { get; set; }
        public DateTime? TrialEndDate { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public virtual ICollection<SubscriptionInvoice>? SubscriptionInvoices { get; set; }
    }

    public enum SubscriptionStatus
    {
        Trial = 0,
        Active = 1,
        PastDue = 2,
        Cancelled = 3,
        Suspended = 4,
        Expired = 5
    }
}