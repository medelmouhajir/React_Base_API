using Microsoft.AspNetCore.Identity;
using React_Virtuello.Server.Models.Attachments;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Businesses
{
    public class Business : LocationEntity
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        public BusinessStatus Status { get; set; } = BusinessStatus.Draft;

        [Phone]
        [MaxLength(20)]
        public string? Phone { get; set; }

        [EmailAddress]
        [MaxLength(255)]
        public string? Email { get; set; }

        [MaxLength(500)]
        public string? ImagePath { get; set; }

        [MaxLength(500)]
        public string? LogoPath { get; set; }

        [MaxLength(50)]
        public string? WhatsApp { get; set; }

        [MaxLength(100)]
        public string? Instagram { get; set; }

        [MaxLength(100)]
        public string? Facebook { get; set; }

        [Url]
        [MaxLength(500)]
        public string? Website { get; set; }

        // Relationships
        [Required]
        public string OwnerId { get; set; } = string.Empty;
        public virtual User Owner { get; set; } = null!;

        // Navigation properties
        public virtual ICollection<Business_Tour> Tours { get; set; } = new List<Business_Tour>();
        public virtual ICollection<Business_Tag> Tags { get; set; } = new List<Business_Tag>();
        public virtual ICollection<BusinessComment> Comments { get; set; } = new List<BusinessComment>();
        public virtual ICollection<BusinessAttachment> Attachments { get; set; } = new List<BusinessAttachment>();

        // Computed properties
        public double? AverageRating => Comments?.Any() == true ? Comments.Average(c => c.Score) : null;
        public int CommentCount => Comments?.Count ?? 0;
    }
    public enum BusinessStatus
    {
        Draft = 0,
        Active = 1,
        Suspended = 2,
        Closed = 3,
        UnderReview = 4
    }
}
