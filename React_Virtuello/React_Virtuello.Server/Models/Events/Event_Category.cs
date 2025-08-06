namespace React_Virtuello.Server.Models.Events
{
    public class Event_Category
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public string Name { get; set; }

        public virtual ICollection<Event>? Events { get; set; }
    }
}
