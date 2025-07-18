// Controllers/VerificationController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.DTOs;
using React_Identity.Server.Models;
using React_Identity.Server.Services;
using System.Text.Json;

namespace React_Identity.Server.Controllers
{
    [Route("api/verify")]
    [ApiController]
    [Authorize]
    public class VerificationController : ControllerBase
    {
        private readonly IdentityDbContext _context;
        private readonly IVerificationService _verificationService;
        private readonly IStorageService _storageService;
        private readonly ILogger<VerificationController> _logger;

        public VerificationController(
            IdentityDbContext context,
            IVerificationService verificationService,
            IStorageService storageService,
            ILogger<VerificationController> logger)
        {
            _context = context;
            _verificationService = verificationService;
            _storageService = storageService;
            _logger = logger;
        }

        [HttpPost("selfie")]
        public async Task<ActionResult<VerificationResponseDto>> SubmitSelfie(SelfieSubmitDto dto)
        {
            try
            {
                // Validate account exists
                if (!await _context.Accounts.AnyAsync(a => a.AccountId == dto.AccountId && a.IsActive))
                {
                    return BadRequest(new ErrorResponseDto
                    {
                        ErrorCode = "INVALID_ACCOUNT",
                        Message = "Account not found or inactive."
                    });
                }

                // Check for existing request with same external reference
                if (!string.IsNullOrEmpty(dto.ExternalReference))
                {
                    var existingRequest = await _context.VerificationRequests
                        .FirstOrDefaultAsync(r => r.AccountId == dto.AccountId &&
                                           r.ExternalReference == dto.ExternalReference);

                    if (existingRequest != null)
                    {
                        return Ok(new VerificationResponseDto
                        {
                            RequestId = existingRequest.RequestId,
                            Status = existingRequest.Status,
                            Message = "Request already exists with this external reference.",
                            CreatedAt = existingRequest.CreatedAt
                        });
                    }
                }

                // Create verification request
                var request = new VerificationRequest
                {
                    RequestId = Guid.NewGuid(),
                    AccountId = dto.AccountId,
                    Type = VerificationType.Selfie,
                    Status = VerificationStatus.Pending,
                    ExternalReference = dto.ExternalReference,
                    MetaData = dto.MetaData,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                // Save image to storage
                var imagePath = await _storageService.SaveImageAsync(
                    dto.ImageBase64,
                    $"selfies/{request.RequestId}",
                    "selfie.jpg");

                // Create selfie request
                var selfieRequest = new SelfieRequest
                {
                    SelfieRequestId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    ImagePath = imagePath,
                    ProcessedAt = DateTime.UtcNow
                };

                _context.VerificationRequests.Add(request);
                _context.SelfieRequests.Add(selfieRequest);
                await _context.SaveChangesAsync();

                // Queue for processing
                await _verificationService.QueueSelfieVerificationAsync(request.RequestId);

                _logger.LogInformation("Selfie verification request created: {RequestId}", request.RequestId);

                return Ok(new VerificationResponseDto
                {
                    RequestId = request.RequestId,
                    Status = request.Status,
                    Message = "Selfie submitted successfully. Processing will begin shortly.",
                    CreatedAt = request.CreatedAt,
                    EstimatedCompletion = DateTime.UtcNow.AddMinutes(5)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting selfie for account: {AccountId}", dto.AccountId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while processing the selfie submission."
                });
            }
        }

        [HttpPost("document")]
        public async Task<ActionResult<VerificationResponseDto>> SubmitDocument(DocumentSubmitDto dto)
        {
            try
            {
                // Validate account exists
                if (!await _context.Accounts.AnyAsync(a => a.AccountId == dto.AccountId && a.IsActive))
                {
                    return BadRequest(new ErrorResponseDto
                    {
                        ErrorCode = "INVALID_ACCOUNT",
                        Message = "Account not found or inactive."
                    });
                }

                // Check for existing request with same external reference
                if (!string.IsNullOrEmpty(dto.ExternalReference))
                {
                    var existingRequest = await _context.VerificationRequests
                        .FirstOrDefaultAsync(r => r.AccountId == dto.AccountId &&
                                           r.ExternalReference == dto.ExternalReference);

                    if (existingRequest != null)
                    {
                        return Ok(new VerificationResponseDto
                        {
                            RequestId = existingRequest.RequestId,
                            Status = existingRequest.Status,
                            Message = "Request already exists with this external reference.",
                            CreatedAt = existingRequest.CreatedAt
                        });
                    }
                }

                // Create verification request
                var request = new VerificationRequest
                {
                    RequestId = Guid.NewGuid(),
                    AccountId = dto.AccountId,
                    Type = VerificationType.Document,
                    Status = VerificationStatus.Pending,
                    ExternalReference = dto.ExternalReference,
                    MetaData = dto.MetaData,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                // Save image to storage
                var imagePath = await _storageService.SaveImageAsync(
                    dto.ImageBase64,
                    $"documents/{request.RequestId}",
                    $"document_{dto.DocType.ToString().ToLower()}.jpg");

                // Create document request
                var documentRequest = new DocumentRequest
                {
                    DocumentRequestId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    DocType = dto.DocType,
                    ImagePath = imagePath,
                    ProcessedAt = DateTime.UtcNow
                };

                _context.VerificationRequests.Add(request);
                _context.DocumentRequests.Add(documentRequest);
                await _context.SaveChangesAsync();

                // Queue for processing
                await _verificationService.QueueDocumentVerificationAsync(request.RequestId);

                _logger.LogInformation("Document verification request created: {RequestId}", request.RequestId);

                return Ok(new VerificationResponseDto
                {
                    RequestId = request.RequestId,
                    Status = request.Status,
                    Message = "Document submitted successfully. Processing will begin shortly.",
                    CreatedAt = request.CreatedAt,
                    EstimatedCompletion = DateTime.UtcNow.AddMinutes(10)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting document for account: {AccountId}", dto.AccountId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while processing the document submission."
                });
            }
        }

        [HttpPost("combined")]
        public async Task<ActionResult<VerificationResponseDto>> SubmitCombinedVerification(CombinedVerificationDto dto)
        {
            try
            {
                // Validate account exists
                if (!await _context.Accounts.AnyAsync(a => a.AccountId == dto.AccountId && a.IsActive))
                {
                    return BadRequest(new ErrorResponseDto
                    {
                        ErrorCode = "INVALID_ACCOUNT",
                        Message = "Account not found or inactive."
                    });
                }

                // Check for existing request
                if (!string.IsNullOrEmpty(dto.ExternalReference))
                {
                    var existingRequest = await _context.VerificationRequests
                        .FirstOrDefaultAsync(r => r.AccountId == dto.AccountId &&
                                           r.ExternalReference == dto.ExternalReference);

                    if (existingRequest != null)
                    {
                        return Ok(new VerificationResponseDto
                        {
                            RequestId = existingRequest.RequestId,
                            Status = existingRequest.Status,
                            Message = "Request already exists with this external reference.",
                            CreatedAt = existingRequest.CreatedAt
                        });
                    }
                }

                // Create combined verification request
                var request = new VerificationRequest
                {
                    RequestId = Guid.NewGuid(),
                    AccountId = dto.AccountId,
                    Type = VerificationType.Combined,
                    Status = VerificationStatus.Pending,
                    ExternalReference = dto.ExternalReference,
                    MetaData = dto.MetaData,
                    CreatedAt = DateTime.UtcNow,
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                };

                // Save selfie image
                var selfiePath = await _storageService.SaveImageAsync(
                    dto.SelfieImageBase64,
                    $"combined/{request.RequestId}",
                    "selfie.jpg");

                // Save document image
                var documentPath = await _storageService.SaveImageAsync(
                    dto.DocumentImageBase64,
                    $"combined/{request.RequestId}",
                    $"document_{dto.DocType.ToString().ToLower()}.jpg");

                // Create selfie request
                var selfieRequest = new SelfieRequest
                {
                    SelfieRequestId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    ImagePath = selfiePath,
                    ProcessedAt = DateTime.UtcNow
                };

                // Create document request
                var documentRequest = new DocumentRequest
                {
                    DocumentRequestId = Guid.NewGuid(),
                    RequestId = request.RequestId,
                    DocType = dto.DocType,
                    ImagePath = documentPath,
                    ProcessedAt = DateTime.UtcNow
                };

                _context.VerificationRequests.Add(request);
                _context.SelfieRequests.Add(selfieRequest);
                _context.DocumentRequests.Add(documentRequest);
                await _context.SaveChangesAsync();

                // Queue for processing
                await _verificationService.QueueCombinedVerificationAsync(request.RequestId);

                _logger.LogInformation("Combined verification request created: {RequestId}", request.RequestId);

                return Ok(new VerificationResponseDto
                {
                    RequestId = request.RequestId,
                    Status = request.Status,
                    Message = "Combined verification submitted successfully. Processing will begin shortly.",
                    CreatedAt = request.CreatedAt,
                    EstimatedCompletion = DateTime.UtcNow.AddMinutes(15)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error submitting combined verification for account: {AccountId}", dto.AccountId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while processing the combined verification submission."
                });
            }
        }

        [HttpGet("{requestId}")]
        public async Task<ActionResult<VerificationResultDto>> GetVerificationResult(Guid requestId)
        {
            try
            {
                var request = await _context.VerificationRequests
                    .Include(r => r.SelfieRequest)
                    .Include(r => r.DocumentRequest)
                    .Include(r => r.Results)
                    .FirstOrDefaultAsync(r => r.RequestId == requestId);

                if (request == null)
                {
                    return NotFound(new ErrorResponseDto
                    {
                        ErrorCode = "REQUEST_NOT_FOUND",
                        Message = "Verification request not found."
                    });
                }

                var result = new VerificationResultDto
                {
                    RequestId = request.RequestId,
                    Status = request.Status,
                    Type = request.Type,
                    CreatedAt = request.CreatedAt,
                    CompletedAt = request.CompletedAt,
                    OverallSuccess = request.Results.Any() && request.Results.All(r => r.Success),
                    Results = request.Results.Select(r => new VerificationDetailDto
                    {
                        Type = r.Type,
                        Success = r.Success,
                        ConfidenceScore = r.ConfidenceScore,
                        Details = r.Details,
                        FailureReason = r.FailureReason,
                        CreatedAt = r.CreatedAt
                    }).ToList()
                };

                // Add selfie result if available
                if (request.SelfieRequest != null)
                {
                    result.SelfieResult = new SelfieResultDto
                    {
                        LivenessCheckPassed = request.SelfieRequest.LivenessCheckPassed,
                        ConfidenceScore = request.SelfieRequest.ConfidenceScore,
                        FailureReason = request.SelfieRequest.FailureReason,
                        ProcessedAt = request.SelfieRequest.ProcessedAt
                    };
                }

                // Add document result if available
                if (request.DocumentRequest != null)
                {
                    result.DocumentResult = new DocumentResultDto
                    {
                        DocType = request.DocumentRequest.DocType,
                        IsForgerySuspected = request.DocumentRequest.IsForgerySuspected,
                        DocumentQualityScore = request.DocumentRequest.DocumentQualityScore,
                        FailureReason = request.DocumentRequest.FailureReason,
                        ProcessedAt = request.DocumentRequest.ProcessedAt,
                        ExtractedFullName = request.DocumentRequest.ExtractedFullName,
                        ExtractedDocumentNumber = request.DocumentRequest.ExtractedDocumentNumber,
                        ExtractedBirthDate = request.DocumentRequest.ExtractedBirthDate,
                        ExtractedExpiryDate = request.DocumentRequest.ExtractedExpiryDate,
                        ExtractedNationality = request.DocumentRequest.ExtractedNationality
                    };

                    // Parse additional extracted data
                    if (!string.IsNullOrEmpty(request.DocumentRequest.ExtractedData))
                    {
                        try
                        {
                            result.DocumentResult.AdditionalData =
                                JsonSerializer.Deserialize<Dictionary<string, object>>(request.DocumentRequest.ExtractedData);
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning(ex, "Failed to parse extracted data for request: {RequestId}", requestId);
                        }
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verification result for request: {RequestId}", requestId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while retrieving the verification result."
                });
            }
        }

        [HttpGet("account/{accountId}")]
        public async Task<ActionResult<List<VerificationResultDto>>> GetAccountVerifications(
            Guid accountId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] VerificationStatus? status = null)
        {
            try
            {
                var query = _context.VerificationRequests
                    .Include(r => r.SelfieRequest)
                    .Include(r => r.DocumentRequest)
                    .Include(r => r.Results)
                    .Where(r => r.AccountId == accountId);

                if (status.HasValue)
                {
                    query = query.Where(r => r.Status == status.Value);
                }

                var requests = await query
                    .OrderByDescending(r => r.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                var results = requests.Select(request => new VerificationResultDto
                {
                    RequestId = request.RequestId,
                    Status = request.Status,
                    Type = request.Type,
                    CreatedAt = request.CreatedAt,
                    CompletedAt = request.CompletedAt,
                    OverallSuccess = request.Results.Any() && request.Results.All(r => r.Success),
                    SelfieResult = request.SelfieRequest != null ? new SelfieResultDto
                    {
                        LivenessCheckPassed = request.SelfieRequest.LivenessCheckPassed,
                        ConfidenceScore = request.SelfieRequest.ConfidenceScore,
                        FailureReason = request.SelfieRequest.FailureReason,
                        ProcessedAt = request.SelfieRequest.ProcessedAt
                    } : null,
                    DocumentResult = request.DocumentRequest != null ? new DocumentResultDto
                    {
                        DocType = request.DocumentRequest.DocType,
                        IsForgerySuspected = request.DocumentRequest.IsForgerySuspected,
                        DocumentQualityScore = request.DocumentRequest.DocumentQualityScore,
                        FailureReason = request.DocumentRequest.FailureReason,
                        ProcessedAt = request.DocumentRequest.ProcessedAt,
                        ExtractedFullName = request.DocumentRequest.ExtractedFullName,
                        ExtractedDocumentNumber = request.DocumentRequest.ExtractedDocumentNumber,
                        ExtractedBirthDate = request.DocumentRequest.ExtractedBirthDate,
                        ExtractedExpiryDate = request.DocumentRequest.ExtractedExpiryDate,
                        ExtractedNationality = request.DocumentRequest.ExtractedNationality
                    } : null
                }).ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting verifications for account: {AccountId}", accountId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while retrieving verification history."
                });
            }
        }
    }
}