using Microsoft.AspNetCore.Identity;
using React_Rentify.Server.Models.Agencies;

namespace React_Rentify.Server.Models.Users
{
    public class User : IdentityUser
    {
        /// <summary>
        /// Display name of the user.
        /// </summary>
        public string FullName { get; set; }

        public string? Picture { get; set; }

        /// <summary>
        /// Role: PlatformAdmin, AgencyOwner, or AgencyManager.
        /// </summary>
        public User_Role Role { get; set; }

        /// <summary>
        /// If Role is AgencyOwner or AgencyManager, this points to their Agency. Null if PlatformAdmin.
        /// </summary>
        public Guid? AgencyId { get; set; }
        public Agency? Agency { get; set; }

        /// <summary>
        /// If false, the user account is disabled (cannot log in).
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// When the user was first created.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
    public enum User_Role
    {
        Admin = 0,
        Owner = 1,
        Manager = 2,
        Customer = 3,
    }
}
