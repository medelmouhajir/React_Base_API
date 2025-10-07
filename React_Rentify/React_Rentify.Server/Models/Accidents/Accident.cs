using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Users;
using System.ComponentModel;

namespace React_Rentify.Server.Models.Accidents
{
    public class Accident
    {
        public Guid Id { get; set; }


        public Guid AgencyId { get; set; }
        public virtual Agency? Agency { get; set; }


        public Guid CarId { get; set; }
        public virtual Car? Car { get; set; }


        public Guid? ReservationId { get; set; }
        public virtual Reservation? Reservation { get; set; }


        public DateTime AccidentDate { get; set; }

        public string Notes { get; set; }


        [DefaultValue(Accident_Status.Created)]
        public Accident_Status Status { get; set; }

        //Experts apointed to this accident
        public string? ExpertFullname { get; set; }
        public string? ExpertPhone { get; set; }



        //History inputs
        public string? CreatedByUserId { get; set; }
        public virtual User? CreatedByUser { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual ICollection<Accident_Expense>? Accident_Expenses { get; set; }

        public virtual ICollection<Accident_Refund>? Accident_Refunds { get; set; }

    }

    public enum Accident_Status
    {
        Created = 0,
        Maintenance = 1,
        Completed = 2
    }
}
