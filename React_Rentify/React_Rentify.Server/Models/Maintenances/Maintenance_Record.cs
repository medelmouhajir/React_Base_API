using React_Rentify.Server.Models.Cars;

namespace React_Rentify.Server.Models.Maintenances
{
    public class Maintenance_Record
    {
        public Guid Id { get; set; }

        public Guid CarId { get; set; }
        public virtual Car? Car { get; set; }

        public DateTime ScheduledDate { get; set; }
        public string Description { get; set; }    // e.g. “Oil change”, “Tire rotation”

        /// <summary>
        /// Cost of the service (if known).
        /// </summary>
        public decimal? Cost { get; set; }

        /// <summary>
        /// True if the service has been completed.
        /// </summary>
        public bool IsCompleted { get; set; } = false;

        public DateTime? CompletedDate { get; set; }
        public string Remarks { get; set; }
    }
}
