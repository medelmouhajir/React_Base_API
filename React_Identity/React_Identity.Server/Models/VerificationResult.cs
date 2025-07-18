using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace React_Identity.Server.Models
{
    public enum ResultType
    {
        Overall,
        LivenessCheck,
        FaceMatch,
        DocumentOcr,
        ForgeryDetection,
        DataValidation
    }

    public class VerificationResult
    {
        [Key]
        public int VerificationResultId { get; set; }

        [Required]
        public Guid RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public VerificationRequest Request { get; set; } = null!;

        [Required]
        public ResultType Type { get; set; }

        [Required]
        public bool Success { get; set; }

        public double? ConfidenceScore { get; set; }
        public string? Details { get; set; } // JSON details
        public string? FailureReason { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
