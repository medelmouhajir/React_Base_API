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
        public string Name { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Phone]
        public string? Phone { get; set; }

        [EmailAddress]
        public string? Email { get; set; }


        public string? Image_Path { get; set; }
        public string? Logo { get; set; }

        public DateTime Date_Created { get; set; }


        public string? Whatsapp { get; set; }
        public string? Instagram { get; set; }
        public string? Facebook { get; set; }

        [Url]
        public string? Website { get; set; }


        public string? OwnerId { get; set; }
        public virtual User? Owner { get; set; }


        public virtual ICollection<Business_Tour>? Tours { get; set; }
        public virtual ICollection<Business_Tag>? Tags { get; set; }
        public virtual ICollection<Business_Comment>? Comments { get; set; }
        public virtual ICollection<BusinessAttachment>? Attachements { get; set; }

    }
}
