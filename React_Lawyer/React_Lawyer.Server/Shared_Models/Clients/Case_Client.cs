using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Shared_Models.Cases;

namespace Shared_Models.Clients
{
    public class Case_Client
    {
        [Key]
        public int Case_ClientId { get; set; }


        [Required]
        public int ClientId { get; set; }

        [ForeignKey("ClientId")]
        public virtual Client Client { get; set; }


        [Required]
        public int CaseId { get; set; }

        [ForeignKey("CaseId")]
        public virtual Case Case { get; set; }

    }
}
