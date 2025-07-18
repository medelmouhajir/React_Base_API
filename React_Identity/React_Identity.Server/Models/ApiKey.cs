using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.Models
{
    public class ApiKey
    {
        [Key]
        public int ApiKeyId { get; set; }

        [Required]
        public string KeyName { get; set; } = string.Empty;

        [Required]
        public string HashedKey { get; set; } = string.Empty;

        [Required]
        public Guid AccountId { get; set; }

        public Account Account { get; set; } = null!;

        public bool IsActive { get; set; } = true;
        public string[] Scopes { get; set; } = Array.Empty<string>(); // JSON array
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ExpiresAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public string? LastUsedIp { get; set; }
        public int UsageCount { get; set; } = 0;
    }
}
