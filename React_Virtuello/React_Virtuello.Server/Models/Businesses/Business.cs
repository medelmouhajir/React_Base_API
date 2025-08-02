using Microsoft.AspNetCore.Identity;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Models.Users;

namespace React_Virtuello.Server.Models.Businesses
{
    public class Business
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }
        public string? Image_Path { get; set; }
        public string? Logo { get; set; }

        public DateTime Date_Created { get; set; }


        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Whatsapp { get; set; }
        public string? Instagram { get; set; }
        public string? Facebook { get; set; }
        public string? Website { get; set; }
        public string? Address { get; set; }


        public double Latitude { get; set; }
        public double Longitude { get; set; }

        public string? UserId { get; set; }
        public virtual User? User { get; set; }


        public virtual ICollection<Tour>? Tours { get; set; }
        public virtual ICollection<Business_Tag>? Tags { get; set; }

    }
}
