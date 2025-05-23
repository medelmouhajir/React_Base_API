using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Firms
{
    public class LawFirm
    {
        [Key]
        public int LawFirmId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(100)]
        public string Email { get; set; }

        [StringLength(200)]
        public string Website { get; set; }

        [StringLength(50)]
        public string TaxId { get; set; }

        public DateTime FoundedDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [StringLength(100)]
        public string SubscriptionPlan { get; set; }

        public DateTime SubscriptionExpiryDate { get; set; }

        public bool IsActive { get; set; } = true;

        // Billing details
        [StringLength(500)]
        public string BillingAddress { get; set; }

        [StringLength(100)]
        public string BillingContact { get; set; }

        // Navigation properties
        public virtual ICollection<Lawyer> Lawyers { get; set; }
        public virtual ICollection<Secretary> Secretaries { get; set; }
        public virtual ICollection<Client> Clients { get; set; }
        public virtual ICollection<Case> Cases { get; set; }
    }
}
