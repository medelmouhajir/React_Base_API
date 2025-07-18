using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.DTOs
{
    public class ApiKeyCreateDto
    {
        [Required]
        public string KeyName { get; set; } = string.Empty;

        public string[] Scopes { get; set; } = Array.Empty<string>();
        public DateTime? ExpiresAt { get; set; }
    }

    public class ApiKeyResponseDto
    {
        public int ApiKeyId { get; set; }
        public string KeyName { get; set; } = string.Empty;
        public string? PlainTextKey { get; set; } // Only returned once on creation
        public string[] Scopes { get; set; } = Array.Empty<string>();
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; }
        public DateTime? LastUsedAt { get; set; }
        public string? LastUsedIp { get; set; }
        public int UsageCount { get; set; }
    }
}
