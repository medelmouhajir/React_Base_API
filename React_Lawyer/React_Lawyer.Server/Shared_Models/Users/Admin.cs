using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Firms;

namespace Shared_Models.Users
{
    public class Admin
    {
        [Key]
        public int AdminId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public virtual User User { get; set; }

        [StringLength(100)]
        public string Position { get; set; }

        // Administrative permissions
        public bool CanManageUsers { get; set; } = true;
        public bool CanManageBilling { get; set; } = true;
        public bool CanViewReports { get; set; } = true;
        public bool CanManageSettings { get; set; } = true;

        // Navigation property
        public virtual ICollection<LawFirm> ManagedFirms { get; set; }
    }
}
