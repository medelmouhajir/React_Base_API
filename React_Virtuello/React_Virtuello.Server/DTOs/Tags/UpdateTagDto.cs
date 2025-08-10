using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Tags
{
    public class UpdateTagDto
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        // File upload property
        public IFormFile? IconFile { get; set; }

        // Keep existing icon if no new file uploaded
        public bool KeepExistingIcon { get; set; } = true;
    }
}