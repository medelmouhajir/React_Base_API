using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.TimeEntries;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Invoices
{
    public class Invoice
    {
        [Key]
        public int InvoiceId { get; set; }

        [Required]
        [StringLength(50)]
        public string InvoiceNumber { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }

        public int? CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

        [Required]
        public DateTime IssueDate { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime DueDate { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxAmount { get; set; }

        [NotMapped]
        public decimal TotalAmount => Amount + TaxAmount;

        [Column(TypeName = "decimal(18,2)")]
        public decimal PaidAmount { get; set; } = 0;

        [NotMapped]
        public decimal OutstandingAmount => TotalAmount - PaidAmount;

        public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;

        [StringLength(1000)]
        public string Notes { get; set; }

        public DateTime? PaidDate { get; set; }

        [StringLength(100)]
        public string PaymentMethod { get; set; }

        [StringLength(100)]
        public string PaymentReference { get; set; }

        // Navigation properties
        public virtual ICollection<TimeEntry> TimeEntries { get; set; }
        public virtual ICollection<InvoiceItem> Items { get; set; }
        public virtual ICollection<Payment> Payments { get; set; }
    }

    public enum InvoiceStatus
    {
        Draft = 0,
        Issued = 1,
        Sent = 2,
        Overdue = 3,
        PartiallyPaid = 4,
        Paid = 5,
        Cancelled = 6,
        Disputed = 7
    }
}
