namespace React_Rentify.Server.Models.Subscriptions
{
    public class SubscriptionInvoice
    {
        public Guid Id { get; set; }

        public Guid AgencySubscriptionId { get; set; }
        public virtual AgencySubscription? AgencySubscription { get; set; }

        public string InvoiceNumber { get; set; } // AUTO-generated

        public DateTime BillingPeriodStart { get; set; }
        public DateTime BillingPeriodEnd { get; set; }
        public DateTime IssueDate { get; set; }
        public DateTime DueDate { get; set; }

        public decimal Amount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal TotalAmount { get; set; }

        public SubscriptionInvoiceStatus Status { get; set; }
        public DateTime? PaidDate { get; set; }

        public string Currency { get; set; } = "MAD";

        // Payment tracking
        public string? PaymentMethod { get; set; }
        public string? PaymentTransactionId { get; set; }

        public DateTime CreatedAt { get; set; }
    }

    public enum SubscriptionInvoiceStatus
    {
        Draft = 0,
        Sent = 1,
        Paid = 2,
        Overdue = 3,
        Cancelled = 4
    }
}