using React_Virtuello.Server.Models.Attachments;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;
using System.Diagnostics.Tracing;

namespace React_Virtuello.Server.Models.Events
{
    public class Event : LocationEntity
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? Picture { get; set; }

        [Required]
        public DateTime Start { get; set; }

        public DateTime? End { get; set; }

        public EventStatus Status { get; set; } = EventStatus.Draft;
        public EventType Type { get; set; }

        // Validation: End date must be after start date
        public bool IsValid => End == null || End > Start;

        // Computed properties
        public bool IsOngoing => DateTime.UtcNow >= Start && (End == null || DateTime.UtcNow <= End);
        public bool IsUpcoming => Start > DateTime.UtcNow;
        public bool IsCompleted => End.HasValue && End < DateTime.UtcNow;

        // Relationships
        [Required]
        public string OrganizerId { get; set; } = string.Empty;
        public virtual User Organizer { get; set; } = null!;

        [Required]
        public Guid EventCategoryId { get; set; }
        public virtual Event_Category EventCategory { get; set; } = null!;

        // Navigation properties
        public virtual ICollection<EventAttachment> EventAttachments { get; set; } = new List<EventAttachment>();
        public virtual ICollection<Event_Tour> EventTours { get; set; } = new List<Event_Tour>();
        public virtual ICollection<EventComment> EventComments { get; set; } = new List<EventComment>();

        public double? AverageRating => EventComments?.Any() == true ? EventComments.Average(c => c.Score) : null;
    }
    public enum EventStatus
    {
        Draft = 0,
        Published = 1,
        InProgress = 2,
        Completed = 3,
        Cancelled = 4
    }

    public enum EventType
    {
        Conference = 0,
        Workshop = 1,
        Exhibition = 2,
        Concert = 3,
        Sports = 4,
        Festival = 5,
        Other = 6
    }
}
