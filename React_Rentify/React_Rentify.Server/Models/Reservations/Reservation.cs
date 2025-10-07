using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Invoices;
using React_Rentify.Server.Models.Users;

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


        //History
        public string? CreatedByUserId { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public string? DelivredByUserId { get; set; }
        public virtual User? DelivredByUser { get; set; }
        public string? ReturnedToUserId { get; set; }
        public virtual User? ReturnedToUser { get; set; }
        public string? InvoicedByUserId { get; set; }
        public virtual User? InvoicedByUser { get; set; }
        public string? CanceledByUserId { get; set; }
        public virtual User? CanceledByUser { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? DelivredAt { get; set; }
        public DateTime? ReturnedAt { get; set; }
        public DateTime? InvoicedAt { get; set; }
        public DateTime? CanceledAt { get; set; }


        public string? LastUpdateByUserId { get; set; }
        public virtual User? LastUpdateByUser { get; set; }
        public DateTime? LastUpdateAt { get; set; }



        /// <summary>
        /// Link to the generated invoice (1:1).
        /// </summary>
        public virtual Invoice? Invoice { get; set; }
        public virtual ICollection<Reservation_Customer?>? Reservation_Customers { get; set; }
    }
}
