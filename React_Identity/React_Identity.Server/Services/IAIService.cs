using React_Identity.Server.Models;

namespace React_Identity.Server.Services
{
    public interface IAIService
    {
        Task<LivenessResult> PerformLivenessCheckAsync(string imagePath);
        Task<DocumentOcrResult> PerformDocumentOcrAsync(string imagePath, DocumentType docType);
        Task<ForgeryResult> DetectDocumentForgeryAsync(string imagePath);
        Task<FaceMatchResult> PerformFaceMatchingAsync(string selfieImagePath, string documentImagePath);
    }

    public class LivenessResult
    {
        public bool IsLive { get; set; }
        public double Confidence { get; set; }
        public string? FailureReason { get; set; }
        public string? FaceEmbedding { get; set; }
        public string ModelUsed { get; set; } = string.Empty;
    }

    public class DocumentOcrResult
    {
        public bool Success { get; set; }
        public string? FullName { get; set; }
        public string? DocumentNumber { get; set; }
        public DateTime? BirthDate { get; set; }
        public DateTime? ExpiryDate { get; set; }
        public string? Nationality { get; set; }
        public double? QualityScore { get; set; }
        public string? FailureReason { get; set; }
        public string ModelUsed { get; set; } = string.Empty;
        public Dictionary<string, object> ExtractedData { get; set; } = new();
    }

    public class ForgeryResult
    {
        public bool IsForgery { get; set; }
        public double Confidence { get; set; }
        public string? FailureReason { get; set; }
        public string ModelUsed { get; set; } = string.Empty;
        public List<string> SuspiciousFeatures { get; set; } = new();
    }

    public class FaceMatchResult
    {
        public bool IsMatch { get; set; }
        public double Confidence { get; set; }
        public string? FailureReason { get; set; }
        public string ModelUsed { get; set; } = string.Empty;
    }
}
