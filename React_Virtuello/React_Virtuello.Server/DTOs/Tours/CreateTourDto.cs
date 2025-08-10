using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Tours
{
    public class CreateTourDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required]
        public string OwnerId { get; set; } = string.Empty;

        // File upload property
        public IFormFile? ImageFile { get; set; }
    }
}