
using React_Identity.Server.Models;
using System.Text;

namespace React_Identity.Server.Services
{
    public class MockAIService : IAIService
    {
        private readonly ILogger<MockAIService> _logger;
        private readonly Random _random = new();

        public MockAIService(ILogger<MockAIService> logger)
        {
            _logger = logger;
        }

        public async Task<LivenessResult> PerformLivenessCheckAsync(string imagePath)
        {
            _logger.LogInformation("Performing mock liveness check for: {ImagePath}", imagePath);

            // Simulate processing delay
            await Task.Delay(2000);

            // Mock result - 90% chance of success
            var isLive = _random.NextDouble() > 0.1;

            return new LivenessResult
            {
                IsLive = isLive,
                Confidence = isLive ? 0.85 + (_random.NextDouble() * 0.14) : 0.1 + (_random.NextDouble() * 0.3),
                FailureReason = isLive ? null : "Face not detected or suspicious movement patterns",
                FaceEmbedding = Convert.ToBase64String(Encoding.UTF8.GetBytes("mock_face_embedding_" + Guid.NewGuid())),
                ModelUsed = "MockLivenessModel_v1.0"
            };
        }

        public async Task<DocumentOcrResult> PerformDocumentOcrAsync(string imagePath, DocumentType docType)
        {
            _logger.LogInformation("Performing mock OCR for: {ImagePath}, Type: {DocType}", imagePath, docType);

            // Simulate processing delay
            await Task.Delay(3000);

            // Mock result - 85% chance of success
            var success = _random.NextDouble() > 0.15;

            return new DocumentOcrResult
            {
                Success = success,
                FullName = success ? "Ahmed Ben Mohamed" : null,
                DocumentNumber = success ? "AB123456789" : null,
                BirthDate = success ? new DateTime(1990, 5, 15) : null,
                ExpiryDate = success ? DateTime.Now.AddYears(5) : null,
                Nationality = success ? "Moroccan" : null,
                QualityScore = success ? 0.80 + (_random.NextDouble() * 0.19) : 0.1 + (_random.NextDouble() * 0.4),
                FailureReason = success ? null : "Document image quality too low or text not readable",
                ModelUsed = "MockOCRModel_v1.0",
                ExtractedData = success ? new Dictionary<string, object>
                {
                    ["documentType"] = docType.ToString(),
                    ["issueDate"] = DateTime.Now.AddYears(-5),
                    ["placeOfBirth"] = "Casablanca, Morocco"
                } : new Dictionary<string, object>()
            };
        }

        public async Task<ForgeryResult> DetectDocumentForgeryAsync(string imagePath)
        {
            _logger.LogInformation("Performing mock forgery detection for: {ImagePath}", imagePath);

            // Simulate processing delay
            await Task.Delay(1500);

            // Mock result - 5% chance of forgery detection
            var isForgery = _random.NextDouble() < 0.05;

            return new ForgeryResult
            {
                IsForgery = isForgery,
                Confidence = isForgery ? 0.70 + (_random.NextDouble() * 0.29) : 0.05 + (_random.NextDouble() * 0.15),
                FailureReason = isForgery ? null : "No forgery indicators detected",
                ModelUsed = "MockForgeryDetectionModel_v1.0",
                SuspiciousFeatures = isForgery ? new List<string> { "Inconsistent font rendering", "Digital manipulation traces" } : new List<string>()
            };
        }

        public async Task<FaceMatchResult> PerformFaceMatchingAsync(string selfieImagePath, string documentImagePath)
        {
            _logger.LogInformation("Performing mock face matching between: {SelfieImagePath} and {DocumentImagePath}",
                selfieImagePath, documentImagePath);

            // Simulate processing delay
            await Task.Delay(2500);

            // Mock result - 88% chance of successful match
            var isMatch = _random.NextDouble() > 0.12;

            return new FaceMatchResult
            {
                IsMatch = isMatch,
                Confidence = isMatch ? 0.75 + (_random.NextDouble() * 0.24) : 0.1 + (_random.NextDouble() * 0.4),
                FailureReason = isMatch ? null : "Facial features do not match between selfie and document photo",
                ModelUsed = "MockFaceMatchingModel_v1.0"
            };
        }
    }
}