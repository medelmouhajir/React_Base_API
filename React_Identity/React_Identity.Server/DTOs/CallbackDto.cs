using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.DTOs
{
    public class CallbackCreateDto
    {
        [Required, Url]
        public string Url { get; set; } = string.Empty;
    }

    public class CallbackResponseDto
    {
        public int CallbackUrlId { get; set; }
        public string Url { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CallbackPayloadDto
    {
        public Guid AccountId { get; set; }
        public Guid RequestId { get; set; }
        public string VerificationResult { get; set; } = string.Empty; // "approved", "rejected", "failed"
        public VerificationResultDto? Details { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string? ExternalReference { get; set; }
        public string Signature { get; set; } = string.Empty; // HMAC signature for verification
    }
}
