using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Reflection.Metadata;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.TimeEntries;
using Shared_Models.Invoices;
using Shared_Models.Juridictions;

namespace Shared_Models.Cases
{
    public class Case
    {
        [Key]
        public int CaseId { get; set; }

        [Required]
        [StringLength(50)]
        public string CaseNumber { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        public int? LawyerId { get; set; }

        [ForeignKey("LawyerId")]
        public virtual Lawyer AssignedLawyer { get; set; }



        public int? JuridictionId { get; set; }

        [ForeignKey("JuridictionId")]
        public virtual Juridiction Juridiction { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        public CaseType Type { get; set; }

        [Required]
        public CaseStatus Status { get; set; } = CaseStatus.Intake;

        public DateTime OpenDate { get; set; } = DateTime.UtcNow;

        public DateTime? CloseDate { get; set; }


        [StringLength(50)]
        public string CourtCaseNumber { get; set; }

        [StringLength(100)]
        public string OpposingParty { get; set; }

        [StringLength(100)]
        public string OpposingCounsel { get; set; }

        public DateTime? NextHearingDate { get; set; }

        public decimal? ExpectedSettlement { get; set; }

        public decimal? ActualSettlement { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }

        public bool IsUrgent { get; set; } = false;

        public int? ParentCaseId { get; set; }

        [ForeignKey("ParentCaseId")]
        public virtual Case ParentCase { get; set; }

        // Navigation properties
        public virtual ICollection<Case> RelatedCases { get; set; }
        public virtual ICollection<Document> Documents { get; set; }
        public virtual ICollection<CaseEvent> Events { get; set; }
        public virtual ICollection<TimeEntry> TimeEntries { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; }
        public virtual ICollection<Case_Client>? Case_Clients { get; set; }
    }

    public enum CaseType
    {
        FamilyLaw = 0,
        CriminalLaw = 1,
        CivilLaw = 2,
        CommercialLaw = 3,
        AdministrativeLaw = 4,
        LaborLaw = 5,
        IntellectualProperty = 6,
        RealEstate = 7,
        Immigration = 8,
        Other = 10
    }

    public enum CaseStatus
    {
        Intake = 0,
        Opened = 1,
        InProgress = 2,
        PendingCourt = 3,
        PendingClient = 4,
        PendingOpposingParty = 5,
        InNegotiation = 6,
        InMediation = 7,
        InTrial = 8,
        Settlement = 9,
        Judgment = 10,
        Appeal = 11,
        Closed = 12,
        Archived = 13
    }
}
