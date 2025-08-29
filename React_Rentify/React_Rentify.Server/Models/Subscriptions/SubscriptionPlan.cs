using System.ComponentModel.DataAnnotations;

namespace React_Rentify.Server.Models.Subscriptions
{
    public class SubscriptionPlan
    {
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } // "Basic", "Premium", "Enterprise"

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public decimal Price { get; set; }

        [Required]
        public BillingCycle BillingCycle { get; set; } // Monthly, Yearly

        // Feature limits
        public int MaxCars { get; set; }
        public int MaxUsers { get; set; }
        public int MaxCustomers { get; set; }
        public int MaxReservations { get; set; } // per month

        // Feature flags
        public bool HasMaintenanceModule { get; set; }
        public bool HasExpenseTracking { get; set; }
        public bool HasAdvancedReporting { get; set; }
        public bool HasAPIAccess { get; set; }
        public bool HasGPSTracking { get; set; }

        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }

        // Navigation
        public virtual ICollection<AgencySubscription>? AgencySubscriptions { get; set; }
    }

    public enum BillingCycle
    {
        Monthly = 1,
        Yearly = 12
    }
}
