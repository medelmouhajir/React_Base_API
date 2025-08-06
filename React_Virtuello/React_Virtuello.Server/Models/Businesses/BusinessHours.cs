using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Businesses
{
    public class BusinessHours : BaseEntity
    {
        public Guid BusinessId { get; set; }
        public virtual Business Business { get; set; } = null!;

        public DayOfWeek DayOfWeek { get; set; }
        public TimeOnly OpenTime { get; set; }
        public TimeOnly CloseTime { get; set; }
        public bool IsClosed { get; set; }
    }
}
