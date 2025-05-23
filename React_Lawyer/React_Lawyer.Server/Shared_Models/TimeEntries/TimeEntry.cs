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
using Shared_Models.Invoices;

namespace Shared_Models.TimeEntries
{
    public class TimeEntry
    {
        [Key]
        public int TimeEntryId { get; set; }

        [Required]
        public int LawyerId { get; set; }

        public int? ClientId { get; set; }

        public int? CaseId { get; set; }

        [Required]
        public DateTime ActivityDate { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Duration must be at least 1 minute")]
        public int DurationMinutes { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }


        public TimeEntryCategory Category { get; set; } = TimeEntryCategory.LegalWork;

        public bool IsBillable { get; set; } = true;

        [Range(0, double.MaxValue)]
        public decimal HourlyRate { get; set; } = 0;

        public bool IsBilled { get; set; } = false;

        public int? InvoiceId { get; set; }

        public int? LawFirmId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime LastModified { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("LawyerId")]
        public virtual Lawyer Lawyer { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        [ForeignKey("InvoiceId")]
        public virtual Invoice Invoice { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }
    }

    public enum TimeEntryCategory
    {
        LegalWork = 1,
        Research = 2,
        Drafting = 3,
        CourtAppearance = 4,
        ClientMeeting = 5,
        PhoneCall = 6,
        Travel = 7,
        Administrative = 8,
        Other = 10
    }
}
