using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Invoices;

namespace React_Rentify.Server.Models.Reservations
{
    public class Reservation
    {
        public Guid Id { get; set; }


        /// <summary>
        /// Agency that made this reservation.
        /// </summary>
        public Guid AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }

        public Guid CarId { get; set; }
        public virtual Car? Car { get; set; }

        public Guid CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }

        public DateTime? ActualStartTime { get; set; }
        public DateTime? ActualEndTime { get; set; }

        public string Status { get; set; }      // “Reserved”, “Ongoing”, “Completed”, “Cancelled”

        public decimal AgreedPrice { get; set; }
        public decimal? FinalPrice { get; set; }

        public decimal? OdometerStart { get; set; }
        public decimal? OdometerEnd { get; set; }
        public float? FuelLevelStart { get; set; }
        public float? FuelLevelEnd { get; set; }

        public string? PickupLocation { get; set; }
        public string? DropoffLocation { get; set; }

        /// <summary>
        /// Link to the generated invoice (1:1).
        /// </summary>
        public virtual Invoice? Invoice { get; set; }
    }
}
