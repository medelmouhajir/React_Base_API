using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Appointments
{
    public class Appointment
    {
        [Key]
        public int AppointmentId { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        public int? LawyerId { get; set; }

        [ForeignKey("LawyerId")]
        public virtual Lawyer Lawyer { get; set; }

        public int? ClientId { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }

        public int? CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        public int? ScheduledById { get; set; } // UserId of the scheduler

        [ForeignKey("ScheduledById")]
        public virtual User ScheduledBy { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public DateTime EndTime { get; set; }

        [StringLength(500)]
        public string Location { get; set; }

        public bool IsVirtual { get; set; } = false;

        [StringLength(500)]
        public string MeetingLink { get; set; }

        public AppointmentStatus Status { get; set; } = AppointmentStatus.Scheduled;

        public AppointmentType Type { get; set; } = AppointmentType.ClientMeeting;

        public bool ReminderSent { get; set; } = false;

        public DateTime? ReminderSentAt { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }

        public bool IsBillable { get; set; } = true;

        public decimal? BillableAmount { get; set; }
    }

    public enum AppointmentStatus
    {
        Archived = 0,
        Scheduled = 1,
        Confirmed = 2,
        Completed = 3,
        Cancelled = 4,
        Rescheduled = 5,
        NoShow = 6,
    }

    public enum AppointmentType
    {
        Consultation = 0,
        ClientMeeting = 1,
        CourtHearing = 2,
        Deposition = 3,
        Mediation = 4,
        InternalMeeting = 5,
        PhoneCall = 6,
        Other = 10
    }
}
