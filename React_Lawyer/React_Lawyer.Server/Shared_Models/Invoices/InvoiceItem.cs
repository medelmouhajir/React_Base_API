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
    public class InvoiceItem
    {
        [Key]
        public int InvoiceItemId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [ForeignKey("InvoiceId")]
        public virtual Invoice Invoice { get; set; }

        [Required]
        [StringLength(200)]
        public string Description { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Quantity { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        [NotMapped]
        public decimal LineTotal => Quantity * UnitPrice;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxRate { get; set; } = 0;

        [NotMapped]
        public decimal TaxAmount => LineTotal * (TaxRate / 100);

        public int? TimeEntryId { get; set; }

        [ForeignKey("TimeEntryId")]
        public virtual TimeEntry TimeEntry { get; set; }

        public InvoiceItemType ItemType { get; set; } = InvoiceItemType.Service;

        [StringLength(100)]
        public string ItemCode { get; set; }
    }

    public enum InvoiceItemType
    {
        Service = 0,
        Expense = 1,
        Fee = 2,
        Discount = 3,
        Tax = 5,
        Other = 10
    }
}
