using React_Rentify.Server.Models.GPS.Records;

namespace React_Rentify.Server.Models.GPS.Alerts
{
    /// <summary>
    /// Records when a vehicle exceeds the speed limit
    /// </summary>
    public class Speeding_Alert
    {
        public Guid Id { get; set; }

        public Guid Gps_DeviceId { get; set; }
        public virtual Gps_Device? Gps_Device { get; set; }

        public Guid? Location_RecordId { get; set; }
        public virtual Location_Record? Location_Record { get; set; }

        public string DeviceSerialNumber { get; set; }
        public DateTime Timestamp { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        /// <summary>
        /// Actual speed of the vehicle in km/h
        /// </summary>
        public double ActualSpeedKmh { get; set; }

        /// <summary>
        /// Speed limit of the road in km/h
        /// </summary>
        public int SpeedLimitKmh { get; set; }

        /// <summary>
        /// How much the vehicle exceeded the speed limit (km/h)
        /// </summary>
        public double ExceededByKmh { get; set; }

        /// <summary>
        /// Percentage over the speed limit (e.g., 20% over limit)
        /// </summary>
        public double ExceededByPercentage { get; set; }

        /// <summary>
        /// Severity level based on how much over the limit
        /// Low: 1-10 km/h over
        /// Medium: 11-20 km/h over
        /// High: 21-30 km/h over
        /// Critical: 31+ km/h over
        /// </summary>
        public SpeedingSeverity Severity { get; set; }

        /// <summary>
        /// Whether this alert has been acknowledged by a manager
        /// </summary>
        public bool IsAcknowledged { get; set; }

        /// <summary>
        /// When the alert was acknowledged
        /// </summary>
        public DateTime? AcknowledgedAt { get; set; }

        /// <summary>
        /// User ID who acknowledged the alert
        /// </summary>
        public string? AcknowledgedBy { get; set; }

        /// <summary>
        /// Notes about the speeding incident
        /// </summary>
        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum SpeedingSeverity
    {
        Low = 1,        // 1-10 km/h over limit
        Medium = 2,     // 11-20 km/h over limit
        High = 3,       // 21-30 km/h over limit
        Critical = 4    // 31+ km/h over limit
    }
}
