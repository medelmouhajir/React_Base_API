using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Events
{
    public class EventComment : CommentEntity<Event>
    {
        public Guid EventId { get; set; }
        public virtual Event Event { get; set; } = null!;
    }
}
