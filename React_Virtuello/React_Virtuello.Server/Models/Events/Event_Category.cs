using React_Virtuello.Server.Models.Entities;

namespace React_Virtuello.Server.Models.Events
{
    public class Event_Category : AuditableEntity
    {
        public string Name { get; set; }

        public virtual ICollection<Event>? Events { get; set; }
    }
}
