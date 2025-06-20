using React_Mangati.Server.Models.Users;

namespace React_Mangati.Server.Studio.Tokens
{
    public class UserManaBalance
    {
        public Guid Id { get; set; }

        public string UserId { get; set; }
        public virtual User? User { get; set; }


        public decimal CurrentBalance { get; set; }
        public decimal LifetimeEarned { get; set; }
        public decimal LifetimeSpent { get; set; }
        public DateTime LastUpdated { get; set; }
    }
}
