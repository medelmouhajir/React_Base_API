using React_Virtuello.Server.Models.Businesses;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.DTOs.Businesses
{
    public class UpdateBusinessDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public BusinessStatus Status { get; set; }

        [Phone, MaxLength(20)]
        public string? Phone { get; set; }

        [EmailAddress, MaxLength(255)]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? WhatsApp { get; set; }

        [MaxLength(100)]
        public string? Instagram { get; set; }

        [MaxLength(100)]
        public string? Facebook { get; set; }

        [Url, MaxLength(500)]
        public string? Website { get; set; }

        [Required]
        public string OwnerId { get; set; } = string.Empty;

        public double Latitude { get; set; }
        public double Longitude { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        // File upload properties
        public IFormFile? ImageFile { get; set; }
        public IFormFile? LogoFile { get; set; }

        // Keep existing paths if no new files uploaded
        public bool KeepExistingImage { get; set; } = true;
        public bool KeepExistingLogo { get; set; } = true;
    }
}