using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Events
{
    public class CreateEventCategoryDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
    }
}