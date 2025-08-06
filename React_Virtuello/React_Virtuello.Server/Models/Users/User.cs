using Microsoft.AspNetCore.Identity;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Models.Tours;

namespace React_Virtuello.Server.Models.Users
{
    public class User : IdentityUser
    {
        public string Fullname { get; set; }
        public string? Picture_Path { get; set; }

        public string Role { get; set; }

        public DateTime CreatedAt { get; set; }

        public bool IsActive { get; set; }


        public virtual ICollection<Business>? Businesses { get; set; }

        public virtual ICollection<Tour>? Tours { get; set; }


        public virtual ICollection<Event_Comment>? Event_Comments { get; set; }

        public virtual ICollection<Business_Comment>? Business_Comments { get; set; }
    }
}
