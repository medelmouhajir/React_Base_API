using Shared_Models.Firms;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Appointments;
using Shared_Models.Cases;
using Shared_Models.Invoices;

namespace Shared_Models.Clients
{
    public class Client
    {
        [Key]
        public int ClientId { get; set; }

        [Required]
        public int LawFirmId { get; set; }

        [ForeignKey("LawFirmId")]
        public virtual LawFirm LawFirm { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        [StringLength(20)]
        public string IdNumber { get; set; } // National ID or passport number

        public ClientType Type { get; set; } = ClientType.Individual;

        [StringLength(200)]
        public string CompanyName { get; set; } // For corporate clients

        [StringLength(50)]
        public string TaxId { get; set; } // For corporate clients

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(1000)]
        public string Notes { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<Case> Cases { get; set; }
        public virtual ICollection<Appointment> Appointments { get; set; }
        public virtual ICollection<Invoice> Invoices { get; set; }
        public virtual ICollection<Case_Client>? Case_Clients { get; set; }
    }

    public enum ClientType
    {
        Individual,
        Corporate,
        Government,
        NonProfit
    }
}
