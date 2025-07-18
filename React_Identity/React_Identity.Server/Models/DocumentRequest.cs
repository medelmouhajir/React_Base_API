using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace React_Identity.Server.Models
{
    public enum DocumentType
    {
        Passport,
        NationalId,
        DriverLicense,
        ResidencePermit,
        Other
    }

    public class DocumentRequest
    {
        [Key]
        public Guid DocumentRequestId { get; set; }

        [Required]
        public Guid RequestId { get; set; }

        [ForeignKey(nameof(RequestId))]
        public VerificationRequest VerificationRequest { get; set; } = null!;

        [Required]
        public DocumentType DocType { get; set; }

        [Required]
        public string ImagePath { get; set; } = string.Empty;

        public string? ExtractedData { get; set; } // JSON of OCR results
        public bool IsForgerySuspected { get; set; } = false;
        public double? DocumentQualityScore { get; set; }
        public string? FailureReason { get; set; }
        public string? AiModelUsed { get; set; }
        public DateTime ProcessedAt { get; set; }
        public string? ProcessingMetadata { get; set; } // JSON

        // Extracted fields for easy querying
        public string? ExtractedFullName { get; set; }
        public string? ExtractedDocumentNumber { get; set; }
        public DateTime? ExtractedBirthDate { get; set; }
        public DateTime? ExtractedExpiryDate { get; set; }
        public string? ExtractedNationality { get; set; }
    }
}
