using React_Virtuello.Server.Models.Events;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Events
{
    public class UpdateEventDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public DateTime Start { get; set; }

        public DateTime? End { get; set; }

        public EventStatus Status { get; set; }

        public EventType Type { get; set; }

        [Required]
        public string OrganizerId { get; set; } = string.Empty;

        [Required]
        public Guid EventCategoryId { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        // File upload property
        public IFormFile? PictureFile { get; set; }

        // Keep existing picture if no new file uploaded
        public bool KeepExistingPicture { get; set; } = true;
    }
}