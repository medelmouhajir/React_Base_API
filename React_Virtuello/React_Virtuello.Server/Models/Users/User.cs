using Microsoft.AspNetCore.Identity;

namespace React_Virtuello.Server.Models.Users
{
    public class User : IdentityUser
    {
        public string Fullname { get; set; }
        public string? Picture_Path { get; set; }
    }
}
