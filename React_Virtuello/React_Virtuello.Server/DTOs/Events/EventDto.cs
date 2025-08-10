using React_Virtuello.Server.Models.Events;

namespace React_Virtuello.Server.DTOs.Events
{
    public class EventDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Picture { get; set; }
        public DateTime Start { get; set; }
        public DateTime? End { get; set; }
        public EventStatus Status { get; set; }
        public EventType Type { get; set; }
        public string OrganizerId { get; set; } = string.Empty;
        public Guid EventCategoryId { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
    }
}