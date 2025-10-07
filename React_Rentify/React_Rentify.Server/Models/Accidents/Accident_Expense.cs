namespace React_Rentify.Server.Models.Accidents
{
    public class Accident_Expense
    {
        public Guid Id { get; set; }

        public string Name { get; set; }
        public double Amount { get; set; }
        public string? FilePath { get; set; }



        public DateTime? CreatedAt { get; set; }

        public Guid AccidentId { get; set; }
        public virtual Accident? Accident { get; set; }
    }
}
