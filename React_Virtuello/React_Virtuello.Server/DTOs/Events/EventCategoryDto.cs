using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Events
{
    public class EventCategoryDto
    {
        public Guid Id { get; set; }

        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}