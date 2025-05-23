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

namespace Shared_Models.Invoices
{
    public class Payment
    {
        [Key]
        public int PaymentId { get; set; }

        [Required]
        public int InvoiceId { get; set; }

        [ForeignKey("InvoiceId")]
        public virtual Invoice Invoice { get; set; }

        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        public PaymentMethod Method { get; set; }

        [StringLength(100)]
        public string ReferenceNumber { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }

        public int? ReceivedById { get; set; } // UserId who recorded the payment

        [ForeignKey("ReceivedById")]
        public virtual User ReceivedBy { get; set; }

        public PaymentStatus Status { get; set; } = PaymentStatus.Completed;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum PaymentMethod
    {
        Cash = 0,
        Check = 1,
        CreditCard = 2,
        BankTransfer = 3,
        ElectronicPayment = 4,
        Other = 10
    }

    public enum PaymentStatus
    {
        Pending = 0,
        Completed = 1,
        Failed = 2,
        Refunded = 3
    }
}
