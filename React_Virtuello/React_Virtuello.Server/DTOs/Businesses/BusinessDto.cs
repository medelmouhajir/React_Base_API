using React_Virtuello.Server.Models.Businesses;

namespace React_Virtuello.Server.DTOs.Businesses
{
    public class BusinessDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public BusinessStatus Status { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? ImagePath { get; set; }
        public string? LogoPath { get; set; }
        public string? WhatsApp { get; set; }
        public string? Instagram { get; set; }
        public string? Facebook { get; set; }
        public string? Website { get; set; }
        public string OwnerId { get; set; } = string.Empty;
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
        public double? AverageRating { get; set; }
        public int CommentCount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}