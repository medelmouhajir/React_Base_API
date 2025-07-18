using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace React_Identity.Server.Models
{
    public class SelfieRequest
    {
        [Key]
        public Guid SelfieRequestId { get; set; }

        [Required]
        public Guid RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public VerificationRequest VerificationRequest { get; set; } = null!;

        [Required]
        public string ImagePath { get; set; } = string.Empty;

        public string? FaceEmbedding { get; set; } // Encoded face features for matching
        public bool LivenessCheckPassed { get; set; } = false;
        public double? ConfidenceScore { get; set; }
        public string? FailureReason { get; set; }
        public string? AiModelUsed { get; set; }
        public DateTime ProcessedAt { get; set; }
        public string? ProcessingMetadata { get; set; } // JSON
    }
}
