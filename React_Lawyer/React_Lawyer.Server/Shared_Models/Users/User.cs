using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Shared_Models.Users
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string Username { get; set; }

        [Required]
        [StringLength(100)]
        public string Email { get; set; }

        [Required]
        [StringLength(100)]
        public string PasswordHash { get; set; }

        [StringLength(100)]
        public string FirstName { get; set; }

        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [Required]
        public UserRole Role { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? LastLogin { get; set; }




        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiryTime { get; set; }


        public bool IsActive { get; set; } = true;

        // Navigation properties based on role
        public virtual Lawyer Lawyer { get; set; }
        public virtual Secretary Secretary { get; set; }
        public virtual Admin Admin { get; set; }


        public int GetLawFirmId()
        {
            if (Role == UserRole.Lawyer)
            {
                return this.Lawyer.LawFirmId;
            }
            else if (Role == UserRole.Secretary)
            {
                return Secretary.LawFirmId;
            }
            else if (Role == UserRole.Admin)
            {
                return Admin.ManagedFirms.Any() ? Admin.ManagedFirms.FirstOrDefault().LawFirmId : 0;
            }
            else
            {
                return 0;
            }
        }
    }

    public enum UserRole
    {
        Admin,
        Lawyer,
        Secretary
    }
}
