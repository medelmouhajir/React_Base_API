
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.DTOs;
using React_Identity.Server.Models;
using System.Text.Json;

namespace React_Identity.Server.Services
{
    public class VerificationService : IVerificationService
    {
        private readonly IdentityDbContext _context;
        private readonly IMessageQueueService _messageQueue;
        private readonly IAIService _aiService;
        private readonly ICallbackService _callbackService;
        private readonly ILogger<VerificationService> _logger;

        public VerificationService(
            IdentityDbContext context,
            IMessageQueueService messageQueue,
            IAIService aiService,
            ICallbackService callbackService,
            ILogger<VerificationService> logger)
        {
            _context = context;
            _messageQueue = messageQueue;
            _aiService = aiService;
            _callbackService = callbackService;
            _logger = logger;
        }

        public async Task QueueSelfieVerificationAsync(Guid requestId)
        {
            await _messageQueue.PublishAsync("selfie.verification", new { RequestId = requestId });
            _logger.LogInformation("Queued selfie verification for request: {RequestId}", requestId);
        }

        public async Task QueueDocumentVerificationAsync(Guid requestId)
        {
            await _messageQueue.PublishAsync("document.verification", new { RequestId = requestId });
            _logger.LogInformation("Queued document verification for request: {RequestId}", requestId);
        }

        public async Task QueueCombinedVerificationAsync(Guid requestId)
        {
            await _messageQueue.PublishAsync("combined.verification", new { RequestId = requestId });
            _logger.LogInformation("Queued combined verification for request: {RequestId}", requestId);
        }

        public async Task ProcessSelfieVerificationAsync(Guid requestId)
        {
            try
            {
                var request = await _context.VerificationRequests
                    .Include(r => r.SelfieRequest)
                    .Include(r => r.Account)
                    .FirstOrDefaultAsync(r => r.RequestId == requestId);

                if (request?.SelfieRequest == null)
                {
                    _logger.LogWarning("Selfie request not found: {RequestId}", requestId);
                    return;
                }

                // Update status to processing
                request.Status = VerificationStatus.Processing;
                request.ProcessingStartedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Perform liveness check
                var livenessResult = await _aiService.PerformLivenessCheckAsync(request.SelfieRequest.ImagePath);

                // Update selfie request with results
                request.SelfieRequest.LivenessCheckPassed = livenessResult.IsLive;
                request.SelfieRequest.ConfidenceScore = livenessResult.Confidence;
                request.SelfieRequest.FailureReason = livenessResult.FailureReason;
                request.SelfieRequest.FaceEmbedding = livenessResult.FaceEmbedding;
                request.SelfieRequest.AiModelUsed = livenessResult.ModelUsed;

                // Create verification result
                var verificationResult = new VerificationResult
                {
                    RequestId = requestId,
                    Type = ResultType.LivenessCheck,
                    Success = livenessResult.IsLive,
                    ConfidenceScore = livenessResult.Confidence,
                    Details = JsonSerializer.Serialize(livenessResult),
                    FailureReason = livenessResult.FailureReason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.VerificationResults.Add(verificationResult);

                // Update request status
                request.Status = livenessResult.IsLive ? VerificationStatus.Completed : VerificationStatus.Failed;
                request.CompletedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send callback
                await SendCallbackForRequestAsync(request);

                _logger.LogInformation("Completed selfie verification for request: {RequestId}, Success: {Success}",
                    requestId, livenessResult.IsLive);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing selfie verification for request: {RequestId}", requestId);
                await MarkRequestAsFailed(requestId, "Internal processing error");
            }
        }

        public async Task ProcessDocumentVerificationAsync(Guid requestId)
        {
            try
            {
                var request = await _context.VerificationRequests
                    .Include(r => r.DocumentRequest)
                    .Include(r => r.Account)
                    .FirstOrDefaultAsync(r => r.RequestId == requestId);

                if (request?.DocumentRequest == null)
                {
                    _logger.LogWarning("Document request not found: {RequestId}", requestId);
                    return;
                }

                // Update status to processing
                request.Status = VerificationStatus.Processing;
                request.ProcessingStartedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Perform OCR
                var ocrResult = await _aiService.PerformDocumentOcrAsync(
                    request.DocumentRequest.ImagePath,
                    request.DocumentRequest.DocType);

                // Perform forgery detection
                var forgeryResult = await _aiService.DetectDocumentForgeryAsync(request.DocumentRequest.ImagePath);

                // Update document request with results
                request.DocumentRequest.ExtractedData = JsonSerializer.Serialize(ocrResult.ExtractedData);
                request.DocumentRequest.ExtractedFullName = ocrResult.FullName;
                request.DocumentRequest.ExtractedDocumentNumber = ocrResult.DocumentNumber;
                request.DocumentRequest.ExtractedBirthDate = ocrResult.BirthDate;
                request.DocumentRequest.ExtractedExpiryDate = ocrResult.ExpiryDate;
                request.DocumentRequest.ExtractedNationality = ocrResult.Nationality;
                request.DocumentRequest.IsForgerySuspected = forgeryResult.IsForgery;
                request.DocumentRequest.DocumentQualityScore = ocrResult.QualityScore;
                request.DocumentRequest.FailureReason = ocrResult.FailureReason ?? forgeryResult.FailureReason;
                request.DocumentRequest.AiModelUsed = ocrResult.ModelUsed;

                // Create verification results
                var ocrVerificationResult = new VerificationResult
                {
                    RequestId = requestId,
                    Type = ResultType.DocumentOcr,
                    Success = ocrResult.Success,
                    ConfidenceScore = ocrResult.QualityScore,
                    Details = JsonSerializer.Serialize(ocrResult),
                    FailureReason = ocrResult.FailureReason,
                    CreatedAt = DateTime.UtcNow
                };

                var forgeryVerificationResult = new VerificationResult
                {
                    RequestId = requestId,
                    Type = ResultType.ForgeryDetection,
                    Success = !forgeryResult.IsForgery,
                    ConfidenceScore = forgeryResult.Confidence,
                    Details = JsonSerializer.Serialize(forgeryResult),
                    FailureReason = forgeryResult.FailureReason,
                    CreatedAt = DateTime.UtcNow
                };

                _context.VerificationResults.AddRange(ocrVerificationResult, forgeryVerificationResult);

                // Update request status
                bool overallSuccess = ocrResult.Success && !forgeryResult.IsForgery;
                request.Status = overallSuccess ? VerificationStatus.Completed : VerificationStatus.Failed;
                request.CompletedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send callback
                await SendCallbackForRequestAsync(request);

                _logger.LogInformation("Completed document verification for request: {RequestId}, Success: {Success}",
                    requestId, overallSuccess);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing document verification for request: {RequestId}", requestId);
                await MarkRequestAsFailed(requestId, "Internal processing error");
            }
        }

        public async Task ProcessCombinedVerificationAsync(Guid requestId)
        {
            try
            {
                var request = await _context.VerificationRequests
                    .Include(r => r.SelfieRequest)
                    .Include(r => r.DocumentRequest)
                    .Include(r => r.Account)
                    .FirstOrDefaultAsync(r => r.RequestId == requestId);

                if (request?.SelfieRequest == null || request.DocumentRequest == null)
                {
                    _logger.LogWarning("Combined request incomplete: {RequestId}", requestId);
                    return;
                }

                // Update status to processing
                request.Status = VerificationStatus.Processing;
                request.ProcessingStartedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Process selfie
                var livenessResult = await _aiService.PerformLivenessCheckAsync(request.SelfieRequest.ImagePath);

                // Process document
                var ocrResult = await _aiService.PerformDocumentOcrAsync(
                    request.DocumentRequest.ImagePath,
                    request.DocumentRequest.DocType);
                var forgeryResult = await _aiService.DetectDocumentForgeryAsync(request.DocumentRequest.ImagePath);

                // Perform face matching between selfie and document
                var faceMatchResult = await _aiService.PerformFaceMatchingAsync(
                    request.SelfieRequest.ImagePath,
                    request.DocumentRequest.ImagePath);

                // Update requests with results
                UpdateSelfieRequest(request.SelfieRequest, livenessResult);
                UpdateDocumentRequest(request.DocumentRequest, ocrResult, forgeryResult);

                // Create all verification results
                var results = new List<VerificationResult>
                {
                    CreateVerificationResult(requestId, ResultType.LivenessCheck, livenessResult.IsLive,
                        livenessResult.Confidence, livenessResult, livenessResult.FailureReason),
                    CreateVerificationResult(requestId, ResultType.DocumentOcr, ocrResult.Success,
                        ocrResult.QualityScore, ocrResult, ocrResult.FailureReason),
                    CreateVerificationResult(requestId, ResultType.ForgeryDetection, !forgeryResult.IsForgery,
                        forgeryResult.Confidence, forgeryResult, forgeryResult.FailureReason),
                    CreateVerificationResult(requestId, ResultType.FaceMatch, faceMatchResult.IsMatch,
                        faceMatchResult.Confidence, faceMatchResult, faceMatchResult.FailureReason)
                };

                _context.VerificationResults.AddRange(results);

                // Determine overall success
                bool overallSuccess = livenessResult.IsLive &&
                                    ocrResult.Success &&
                                    !forgeryResult.IsForgery &&
                                    faceMatchResult.IsMatch;

                // Create overall result
                var overallResult = CreateVerificationResult(requestId, ResultType.Overall, overallSuccess,
                    results.Where(r => r.Success).Average(r => r.ConfidenceScore),
                    new
                    {
                        liveness = livenessResult.IsLive,
                        documentValid = ocrResult.Success && !forgeryResult.IsForgery,
                        faceMatch = faceMatchResult.IsMatch
                    },
                    overallSuccess ? null : "One or more verification steps failed");

                _context.VerificationResults.Add(overallResult);

                // Update request status
                request.Status = overallSuccess ? VerificationStatus.Completed : VerificationStatus.Failed;
                request.CompletedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send callback
                await SendCallbackForRequestAsync(request);

                _logger.LogInformation("Completed combined verification for request: {RequestId}, Success: {Success}",
                    requestId, overallSuccess);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing combined verification for request: {RequestId}", requestId);
                await MarkRequestAsFailed(requestId, "Internal processing error");
            }
        }

        public async Task SendCallbackAsync(Guid requestId, CallbackPayloadDto payload)
        {
            await _callbackService.SendCallbackAsync(requestId, payload);
        }

        private async Task SendCallbackForRequestAsync(VerificationRequest request)
        {
            var payload = new CallbackPayloadDto
            {
                AccountId = request.AccountId,
                RequestId = request.RequestId,
                VerificationResult = request.Status == VerificationStatus.Completed ? "approved" : "rejected",
                ExternalReference = request.ExternalReference,
                Timestamp = DateTime.UtcNow
            };

            await _callbackService.SendCallbackAsync(request.RequestId, payload);
        }

        private async Task MarkRequestAsFailed(Guid requestId, string reason)
        {
            try
            {
                var request = await _context.VerificationRequests.FindAsync(requestId);
                if (request != null)
                {
                    request.Status = VerificationStatus.Failed;
                    request.CompletedAt = DateTime.UtcNow;

                    var failureResult = new VerificationResult
                    {
                        RequestId = requestId,
                        Type = ResultType.Overall,
                        Success = false,
                        FailureReason = reason,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.VerificationResults.Add(failureResult);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking request as failed: {RequestId}", requestId);
            }
        }

        private void UpdateSelfieRequest(SelfieRequest selfieRequest, dynamic livenessResult)
        {
            selfieRequest.LivenessCheckPassed = livenessResult.IsLive;
            selfieRequest.ConfidenceScore = livenessResult.Confidence;
            selfieRequest.FailureReason = livenessResult.FailureReason;
            selfieRequest.FaceEmbedding = livenessResult.FaceEmbedding;
            selfieRequest.AiModelUsed = livenessResult.ModelUsed;
        }

        private void UpdateDocumentRequest(DocumentRequest documentRequest, dynamic ocrResult, dynamic forgeryResult)
        {
            documentRequest.ExtractedData = JsonSerializer.Serialize(ocrResult.ExtractedData);
            documentRequest.ExtractedFullName = ocrResult.FullName;
            documentRequest.ExtractedDocumentNumber = ocrResult.DocumentNumber;
            documentRequest.ExtractedBirthDate = ocrResult.BirthDate;
            documentRequest.ExtractedExpiryDate = ocrResult.ExpiryDate;
            documentRequest.ExtractedNationality = ocrResult.Nationality;
            documentRequest.IsForgerySuspected = forgeryResult.IsForgery;
            documentRequest.DocumentQualityScore = ocrResult.QualityScore;
            documentRequest.FailureReason = ocrResult.FailureReason ?? forgeryResult.FailureReason;
            documentRequest.AiModelUsed = ocrResult.ModelUsed;
        }

        private VerificationResult CreateVerificationResult(
            Guid requestId,
            ResultType type,
            bool success,
            double? confidence,
            object details,
            string? failureReason)
        {
            return new VerificationResult
            {
                RequestId = requestId,
                Type = type,
                Success = success,
                ConfidenceScore = confidence,
                Details = JsonSerializer.Serialize(details),
                FailureReason = failureReason,
                CreatedAt = DateTime.UtcNow
            };
        }
    }
}