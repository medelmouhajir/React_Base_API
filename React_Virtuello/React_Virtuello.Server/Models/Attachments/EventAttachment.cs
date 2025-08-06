using React_Virtuello.Server.Models.Events;

namespace React_Virtuello.Server.Models.Attachments
{
    public class EventAttachment : Attachment
    {
        public Guid EventId { get; set; }
        public virtual Event? Event { get; set; }
    }
}
