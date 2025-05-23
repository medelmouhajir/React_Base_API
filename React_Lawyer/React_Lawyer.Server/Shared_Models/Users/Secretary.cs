using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Firms;
using Shared_Models.Appointments;

namespace Shared_Models.Users
{
    public class Secretary
    {
        [Key]
        public int SecretaryId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [StringLength(100)]
        public string Position { get; set; }

        public DateTime JoinDate { get; set; } = DateTime.UtcNow;

        // Permissions
        public bool CanManageClients { get; set; } = true;
        public bool CanScheduleAppointments { get; set; } = true;
        public bool CanUploadDocuments { get; set; } = true;
        public bool CanManageBilling { get; set; } = false;

        // Navigation properties
        public virtual ICollection<Lawyer> AssignedLawyers { get; set; }
        public virtual ICollection<Appointment> ScheduledAppointments { get; set; }

    }
}
