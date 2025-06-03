using React_Rentify.Server.Models.Cars;

namespace React_Rentify.Server.Models.Alerts
{
    public class Service_Alert
    {
        public Guid Id { get; set; }

        public Guid CarId { get; set; }
        public virtual Car? Car { get; set; }

        /// <summary>
        /// Type of alert (oil change, drain, etc.).
        /// </summary>
        public Service_Alert_Type AlertType { get; set; }

        /// <summary>
        /// Date when the service is due (e.g. next oil change date).
        /// </summary>
        public DateTime DueDate { get; set; }

        /// <summary>
        /// If you prefer mileage‐based triggers (e.g. every 10,000 km).
        /// </summary>
        public int? DueMileage { get; set; }

        /// <summary>
        /// Has this alert been acknowledged/completed?
        /// </summary>
        public bool IsResolved { get; set; } = false;

        public DateTime? ResolvedDate { get; set; }
        public string? Notes { get; set; }
    }

    public enum Service_Alert_Type
    {
        OilChange = 1,
        BrakeInspection = 2,
        TireRotation = 3,
        FluidCheck = 4,
        Drain = 5,       // e.g. coolant drain or similar
        Other = 10
    }
}
