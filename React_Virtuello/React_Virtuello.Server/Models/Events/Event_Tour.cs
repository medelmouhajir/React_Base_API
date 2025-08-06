using React_Virtuello.Server.Models.Tours;

namespace React_Virtuello.Server.Models.Events
{
    public class Event_Tour
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; }

        public Guid TourId { get; set; }
        public virtual Tour? Tour { get; set; }

        public Guid EventId { get; set; }
        public virtual Event? Event { get; set; }
    }
}
