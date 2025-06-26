using React_Rentify.Server.Models.Customers;

namespace React_Rentify.Server.Models.Reservations
{
    public class Reservation_Customer
    {
        public Guid Id { get; set; }


        public Guid CustomerId { get; set; }
        public virtual Customer? Customer { get; set; }

        public Guid ReservationId { get; set; }
        public virtual Reservation? Reservation { get; set; }

        public DateTime Date_Added { get; set; }
    }
}
