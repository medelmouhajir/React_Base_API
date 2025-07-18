using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace React_Identity.Server.Models
{
    public enum VerificationType
    {
        Selfie,
        Document,
        Combined
    }

    public enum VerificationStatus
    {
        Pending,
        Processing,
        Completed,
        Failed,
        Expired
    }

    public class VerificationRequest
    {
        [Key]
        public Guid RequestId { get; set; }

        [Required]
        public Guid AccountId { get; set; }

        [ForeignKey(nameof(AccountId))]
        public Account Account { get; set; } = null!;

        [Required]
        public VerificationType Type { get; set; }

        [Required]
        public VerificationStatus Status { get; set; } = VerificationStatus.Pending;

        public string? ExternalReference { get; set; } // For idempotency
        public string? MetaData { get; set; } // JSON metadata
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessingStartedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddHours(24);
        public bool CallbackSent { get; set; } = false;
        public int CallbackAttempts { get; set; } = 0;
        public DateTime? LastCallbackAttempt { get; set; }

        // Navigation properties
        public SelfieRequest? SelfieRequest { get; set; }
        public DocumentRequest? DocumentRequest { get; set; }
        public ICollection<VerificationResult> Results { get; set; } = new List<VerificationResult>();
    }
}
