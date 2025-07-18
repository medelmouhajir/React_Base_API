using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.DTOs
{
    public class AccountCreateDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required, MinLength(8)]
        public string Password { get; set; } = string.Empty;

        public string? CompanyName { get; set; }
        public string? FullName { get; set; }
    }

    public class AccountLoginDto
    {
        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class AccountResponseDto
    {
        public Guid AccountId { get; set; }
        public string Email { get; set; } = string.Empty;
        public bool IsEmailVerified { get; set; }
        public bool IsActive { get; set; }
        public string? ApiKey { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int TotalVerifications { get; set; }
        public int ActiveCallbacks { get; set; }
    }

    public class AccountUpdateDto
    {
        public string? NewPassword { get; set; }
        public string? CurrentPassword { get; set; }
        public bool? IsActive { get; set; }
    }
}
