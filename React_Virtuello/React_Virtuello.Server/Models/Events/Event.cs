using React_Virtuello.Server.Models.Attachments;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Events
{
    public class Event : LocationEntity
    {

        [Required]
        public string Name { get; set; }

        public string? Description { get; set; }

        public string? Picture { get; set; }

        [Required]
        public DateTime Date { get; set; }




        public virtual ICollection<EventAttachment>? EventAttachments { get; set; }

        public virtual ICollection<Event_Tour>? Event_Tours { get; set; }

        public virtual ICollection<Event_Comment>? Event_Comments { get; set; }

        public Guid EventCategoryId { get; set; }
        public virtual Event_Category? EventCategory { get; set; }

        public string OrganizerId { get; set; }
        public virtual User? Organizer { get; set; }
    }
}
