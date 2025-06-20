namespace React_Mangati.Server.Studio.Tokens.Transactions
{
    public class ManaPackage
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public decimal ManaAmount { get; set; }
        public decimal Price { get; set; } // in USD
        public decimal? BonusPercentage { get; set; } // e.g., 10% bonus for bulk
        public bool IsActive { get; set; }
    }
}
