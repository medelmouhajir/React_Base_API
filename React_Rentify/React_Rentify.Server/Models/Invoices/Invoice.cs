using React_Rentify.Server.Models.Reservations;

namespace React_Rentify.Server.Models.Invoices
{
    public class Invoice
    {
        public Guid Id { get; set; }

        public Guid ReservationId { get; set; }
        public virtual Reservation? Reservation { get; set; }

        public DateTime IssuedAt { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
        public bool IsPaid { get; set; } = false;
        public string Currency { get; set; } = "MAD";   // Moroccan Dirham

        /// <summary>
        /// e.g. “Cash”, “Credit Card”, “Online”.
        /// </summary>
        public string PaymentMethod { get; set; }

        // If you prefer multiple payments per invoice:
        public virtual ICollection<Payment>? Payments { get; set; }
    }
}
