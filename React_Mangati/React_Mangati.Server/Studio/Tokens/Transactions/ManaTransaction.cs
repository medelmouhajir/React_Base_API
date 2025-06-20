using React_Mangati.Server.Models.Users;

namespace React_Mangati.Server.Studio.Tokens.Transactions
{
    public class ManaTransaction
    {
        public Guid Id { get; set; }

        public string UserId { get; set; }
        public virtual User? User { get; set; }

        public decimal Amount { get; set; }
        public Transaction_Type Type { get; set; } // Purchase, Debit, Refund, Bonus

        public DateTime CreatedAt { get; set; }
        public decimal BalanceAfter { get; set; }
    }

    public enum Transaction_Type
    {
        Purchase = 0,
        Debit = 1,
        Refund = 2,
        Bonus = 3,
        Other = 10
    }
}
