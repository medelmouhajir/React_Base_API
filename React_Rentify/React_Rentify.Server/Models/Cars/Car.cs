using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.Filters.Cars;
using React_Rentify.Server.Models.Maintenances;
using React_Rentify.Server.Models.Reservations;
using System.ComponentModel;

namespace React_Rentify.Server.Models.Cars
{
    public class Car
    {
        public Guid Id { get; set; }


        /// <summary>
        /// The agency that owns this car.
        /// </summary>
        public Guid AgencyId { get; set; }
        public Agency? Agency { get; set; }

        // === Standardized lookup fields ===

        /// <summary>
        /// Foreign key to CarModel. 
        /// CarModel in turn links to a Manufacturer.
        /// </summary>
        public string Car_ModelId { get; set; }
        public virtual Car_Model? Car_Model { get; set; }

        /// <summary>
        /// Foreign key to CarYear (e.g. 2023, 2024, etc.).
        /// </summary>
        public int Car_YearId { get; set; }
        public virtual Car_Year? Car_Year { get; set; }

        /// <summary>
        /// License plate is still unique per car in the agency’s fleet.
        /// </summary>
        public string LicensePlate { get; set; }

        public string Color { get; set; }

        /// <summary>
        /// True if available to rent; false if currently rented or under maintenance.
        /// </summary>
        public bool IsAvailable { get; set; } = true;

        /// <summary>
        /// “Available”, “Rented”, “Maintenance”, “Retired”, etc.
        /// </summary>
        public string Status { get; set; }

        /// <summary>
        /// Base rental price per day.
        /// </summary>
        public decimal DailyRate { get; set; }

        /// <summary>
        /// Optional hourly rate.
        /// </summary>
        public decimal? HourlyRate { get; set; }

        // === KM‐related fields ===
        [DefaultValue(0)]
        public int CurrentKM { get; set; }
        public DateTime? LastKmUpdate { get; set; }

        // === GPS‐related fields ===

        /// <summary>
        /// The unique serial/IMEI of the GPS device installed in the car.
        /// Used by the GPS listener to correlate data.
        /// </summary>
        public string? DeviceSerialNumber { get; set; }

        /// <summary>
        /// If false, do not accept location updates for this car.
        /// </summary>
        public bool IsTrackingActive { get; set; } = true;

        public Gear_type Gear_Type { get; set; } = Gear_type.MANUAL;
        public Engine_Type Engine_Type { get; set; } = Engine_Type.DIESEL;


        // === Navigation ===
        public virtual ICollection<Reservation>? Reservations { get; set; }
        public virtual ICollection<Maintenance_Record>? MaintenanceRecords { get; set; }

        /// <summary>
        /// File attachments (e.g., vehicle registration, inspection certificates, photos).
        /// </summary>
        public virtual ICollection<Car_Attachment>? Car_Attachments { get; set; }
        public virtual ICollection<Car_Image>? Car_Images { get; set; }

        /// <summary>
        /// Periodic service alerts (e.g. vidange, drain).
        /// </summary>
        public virtual ICollection<Service_Alert>? ServiceAlerts { get; set; }
    }

    public enum Gear_type
    {
        MANUAL = 0,
        AUTOMATIC = 1,
    }

    public enum Engine_Type
    {
        GASOLINE = 0,
        DIESEL = 1,
        HYBRID = 2,
        ELECTRIC = 3
    }
}
