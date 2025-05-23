using Shared_Models.Appointments;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Notifications
{
    public class Notification
    {
        [Key]
        public int NotificationId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Message { get; set; }

        public NotificationType Type { get; set; }

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ReadAt { get; set; }

        public int? CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        public int? ClientId { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }

        public int? AppointmentId { get; set; }

        [ForeignKey("AppointmentId")]
        public virtual Appointment Appointment { get; set; }

        public int? DocumentId { get; set; }

        [ForeignKey("DocumentId")]
        public virtual Document Document { get; set; }

        [StringLength(1000)]
        public string ActionUrl { get; set; }
    }

    public enum NotificationType
    {
        CaseUpdate,
        AppointmentReminder,
        DocumentUploaded,
        DeadlineApproaching,
        InvoiceIssued,
        PaymentReceived,
        TaskAssigned,
        SystemAlert,
        CaseStatusChange,
        CaseAssignment,
        Other
    }
}
