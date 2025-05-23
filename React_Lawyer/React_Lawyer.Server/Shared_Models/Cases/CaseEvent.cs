using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Cases
{
    public class CaseEvent
    {
        [Key]
        public int CaseEventId { get; set; }

        [Required]
        public int CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        [Required]
        public int CreatedById { get; set; }

        [ForeignKey("CreatedById")]
        public virtual User CreatedBy { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        [Required]
        public DateTime Date { get; set; }

        public CaseEventType EventType { get; set; }

        public bool IsImportant { get; set; } = false;

        [StringLength(500)]
        public string Location { get; set; }

        [StringLength(100)]
        public string Outcome { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public int? DocumentId { get; set; }

        [ForeignKey("DocumentId")]
        public virtual Document RelatedDocument { get; set; }
    }

    public enum CaseEventType
    {
        Other = 0,
        CourtHearing = 1,
        Filing = 2 ,
        ClientMeeting = 3,
        Deposition = 4,
        Mediation = 5,
        Settlement = 6,
        StatusChange = 7,
        DocumentAdded = 8,
        Deadline = 9,
        ClientRemoved = 10,
        ClientAdded = 11,
    }
}
