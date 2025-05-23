using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Cases;
using Shared_Models.Appointments;
using Shared_Models.TimeEntries;
using Shared_Models.Firms;

namespace Shared_Models.Users
{
    public class Lawyer
    {
        [Key]
        public int LawyerId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [StringLength(100)]
        public string BarNumber { get; set; }

        [StringLength(100)]
        public string Title { get; set; }

        [StringLength(500)]
        public string Biography { get; set; }

        public DateTime JoinDate { get; set; } = DateTime.UtcNow;

        // Specializations stored as a comma-separated list
        [StringLength(500)]
        public string Specializations { get; set; }

        public decimal HourlyRate { get; set; }

        // Navigation properties
        public virtual ICollection<Case> Cases { get; set; }
        public virtual ICollection<Appointment> Appointments { get; set; }
        public virtual ICollection<TimeEntry> TimeEntries { get; set; }
    }
}
