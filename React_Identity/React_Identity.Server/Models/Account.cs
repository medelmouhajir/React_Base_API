using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.Models
{
    public class Account
    {
        [Key]
        public Guid AccountId { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();

        [Required]
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();

        public bool IsEmailVerified { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string? ApiKey { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }

        // Navigation properties
        public ICollection<CallbackUrl> CallbackUrls { get; set; } = new List<CallbackUrl>();
        public ICollection<VerificationRequest> VerificationRequests { get; set; } = new List<VerificationRequest>();
    }
}
