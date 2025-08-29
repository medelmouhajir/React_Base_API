namespace React_Rentify.Server.Models.Subscriptions
{
    public class SubscriptionUsage
    {
        public Guid Id { get; set; }

        public Guid AgencySubscriptionId { get; set; }
        public virtual AgencySubscription? AgencySubscription { get; set; }

        public int Year { get; set; }
        public int Month { get; set; }

        // Usage counters
        public int CarsCount { get; set; }
        public int UsersCount { get; set; }
        public int CustomersCount { get; set; }
        public int ReservationsCount { get; set; }

        public DateTime RecordedAt { get; set; }
    }
}