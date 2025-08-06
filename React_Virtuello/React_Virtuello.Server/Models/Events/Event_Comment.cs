using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Events
{
    public class Event_Comment : BaseEntity
    {


        [Range(1, 5)]
        public int Score { get; set; }  // 1 to 5 stars

        [Required]
        public string Content { get; set; }



        public string? UserId { get; set; }
        public virtual User? User { get; set; }


        public Guid? EventId { get; set; }
        public virtual Event? Event { get; set; }
    }
}
