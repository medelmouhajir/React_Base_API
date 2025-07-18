using React_Identity.Server.Models;
using System.ComponentModel.DataAnnotations;

namespace React_Identity.Server.DTOs
{
    public class SelfieSubmitDto
    {
        [Required]
        public Guid AccountId { get; set; }

        [Required]
        public string ImageBase64 { get; set; } = string.Empty;

        public string? ExternalReference { get; set; }
        public string? MetaData { get; set; }
    }

    public class DocumentSubmitDto
    {
        [Required]
        public Guid AccountId { get; set; }

        [Required]
        public DocumentType DocType { get; set; }

        [Required]
        public string ImageBase64 { get; set; } = string.Empty;

        public string? ExternalReference { get; set; }
        public string? MetaData { get; set; }
    }

    public class CombinedVerificationDto
    {
        [Required]
        public Guid AccountId { get; set; }

        [Required]
        public string SelfieImageBase64 { get; set; } = string.Empty;

        [Required]
        public DocumentType DocType { get; set; }

        [Required]
        public string DocumentImageBase64 { get; set; } = string.Empty;

        public string? ExternalReference { get; set; }
        public string? MetaData { get; set; }
    }

    public class VerificationResponseDto
    {
        public Guid RequestId { get; set; }
        public VerificationStatus Status { get; set; }
        public string Message { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? EstimatedCompletion { get; set; }
    }

    public class VerificationResultDto
    {
        public Guid RequestId { get; set; }
        public VerificationStatus Status { get; set; }
        public VerificationType Type { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }

        public SelfieResultDto? SelfieResult { get; set; }
        public DocumentResultDto? DocumentResult { get; set; }
        public List<VerificationDetailDto> Results { get; set; } = new();
        public bool OverallSuccess { get; set; }
        public string? FailureReason { get; set; }
    }

    public class SelfieResultDto
    {
        public bool LivenessCheckPassed { get; set; }
        public double? ConfidenceScore { get; set; }
        public string? FailureReason { get; set; }
        public DateTime ProcessedAt { get; set; }
    }

    public class DocumentResultDto
    {
        public DocumentType DocType { get; set; }
        public bool IsForgerySuspected { get; set; }
        public double? DocumentQualityScore { get; set; }
        public string? FailureReason { get; set; }
        public DateTime ProcessedAt { get; set; }

        // Extracted data
        public string? ExtractedFullName { get; set; }
        public string? ExtractedDocumentNumber { get; set; }
        public DateTime? ExtractedBirthDate { get; set; }
        public DateTime? ExtractedExpiryDate { get; set; }
        public string? ExtractedNationality { get; set; }
        public Dictionary<string, object>? AdditionalData { get; set; }
    }

    public class VerificationDetailDto
    {
        public ResultType Type { get; set; }
        public bool Success { get; set; }
        public double? ConfidenceScore { get; set; }
        public string? Details { get; set; }
        public string? FailureReason { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
