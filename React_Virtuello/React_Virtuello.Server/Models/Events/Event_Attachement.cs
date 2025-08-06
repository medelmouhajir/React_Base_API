namespace React_Virtuello.Server.Models.Events
{
    public class Event_Attachement
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string Name { get; set; }
        public string Path { get; set; }

        public DateTime CreatedAt { get; set; }

        public Guid EventId { get; set; }
        public virtual Event? Event { get; set; }

    }
}
