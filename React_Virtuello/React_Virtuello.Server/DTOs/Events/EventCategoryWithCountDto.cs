namespace React_Virtuello.Server.DTOs.Events
{
    public class EventCategoryWithCountDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int EventCount { get; set; }
    }
}