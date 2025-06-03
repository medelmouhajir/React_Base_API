namespace React_Rentify.Server.Models.Invoices
{
    public class Payment
    {
        public Guid Id { get; set; }

        public Guid InvoiceId { get; set; }
        public virtual Invoice? Invoice { get; set; }

        public DateTime PaidAt { get; set; } = DateTime.UtcNow;
        public decimal Amount { get; set; }
        public string Method { get; set; }          // e.g. “Cash”, “Visa **** 1234”
        public string TransactionId { get; set; }   // Gateway confirmation
    }
}
