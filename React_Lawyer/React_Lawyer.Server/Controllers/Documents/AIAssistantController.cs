using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using React_Lawyer.Server.Services.DocumentGeneration;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Juridictions;
using System.Security.Claims;
using System.Text.Json;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/ai-assistant")]
    [ApiController]
    [Authorize]
    public class AIAssistantController : ControllerBase
    {
        private readonly EnhancedGeminiService _geminiService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<AIAssistantController> _logger;

        public AIAssistantController(
            EnhancedGeminiService geminiService,
            ApplicationDbContext context,
            ILogger<AIAssistantController> logger)
        {
            _geminiService = geminiService;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Check document for spelling and syntax errors
        /// </summary>
        [HttpPost("check-spelling")]
        public async Task<ActionResult<IEnumerable<AISuggestion>>> CheckSpellingAndSyntax([FromBody] DocumentContentModel model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                var suggestions = await _geminiService.CheckSpellingAndSyntaxAsync(
                    model.Content,
                    model.Language ?? "en");

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking spelling and syntax");
                return StatusCode(500, new { message = "Failed to check spelling and syntax" });
            }
        }

        /// <summary>
        /// Get suggestions for more elegant phrasing
        /// </summary>
        [HttpPost("elegant-phrasing")]
        public async Task<ActionResult<IEnumerable<AISuggestion>>> GetElegantPhrasing([FromBody] DocumentContentModel model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                var suggestions = await _geminiService.SuggestElegantPhrasingAsync(
                    model.Content,
                    model.Language ?? "en");

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating elegant phrasing suggestions");
                return StatusCode(500, new { message = "Failed to generate elegant phrasing suggestions" });
            }
        }

        /// <summary>
        /// Translate document content to a different language
        /// </summary>
        [HttpPost("translate")]
        public async Task<ActionResult<TranslationResponse>> TranslateDocument([FromBody] TranslationRequest model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                if (string.IsNullOrEmpty(model.TargetLanguage))
                {
                    return BadRequest(new { message = "Target language is required" });
                }

                var translatedContent = await _geminiService.TranslateDocumentAsync(
                    model.Content,
                    model.TargetLanguage);

                return Ok(new TranslationResponse
                {
                    OriginalContent = model.Content,
                    TranslatedContent = translatedContent,
                    TargetLanguage = model.TargetLanguage
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error translating document");
                return StatusCode(500, new { message = "Failed to translate document" });
            }
        }

        /// <summary>
        /// Summarize document content
        /// </summary>
        [HttpPost("summarize")]
        public async Task<ActionResult<SummaryResponse>> SummarizeDocument([FromBody] SummaryRequest model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                var summary = await _geminiService.SummarizeDocumentAsync(
                    model.Content,
                    model.MaxLength ?? 300);

                return Ok(new SummaryResponse
                {
                    OriginalContent = model.Content,
                    Summary = summary
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error summarizing document");
                return StatusCode(500, new { message = "Failed to summarize document" });
            }
        }

        /// <summary>
        /// Get client data for the document
        /// </summary>
        [HttpGet("client-data/{clientId}")]
        public async Task<ActionResult<object>> GetClientData(int clientId)
        {
            try
            {
                var client = await _context.Clients
                    .Where(c => c.ClientId == clientId)
                    .Select(c => new
                    {
                        c.ClientId,
                        c.FirstName,
                        c.LastName,
                        c.Email,
                        c.PhoneNumber,
                        c.Address,
                        Type = c.Type.ToString(),
                        c.CompanyName,
                        c.TaxId,
                        c.IdNumber,
                        FullName = c.FirstName + " " + c.LastName
                    })
                    .FirstOrDefaultAsync();

                if (client == null)
                {
                    return NotFound(new { message = $"Client with ID {clientId} not found" });
                }

                return Ok(client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting client data for AI assistant");
                return StatusCode(500, new { message = "Failed to get client data" });
            }
        }

        /// <summary>
        /// Get case data for the document
        /// </summary>
        [HttpGet("case-data/{caseId}")]
        public async Task<ActionResult<object>> GetCaseData(int caseId)
        {
            try
            {
                var caseData = await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                    .Include(x=> x.Juridiction)
                    .Where(c => c.CaseId == caseId)
                    .Select(c => new
                    {
                        c.CaseId,
                        c.CaseNumber,
                        c.Title,
                        c.Description,
                        Type = c.Type.ToString(),
                        Status = c.Status.ToString(),
                        OpenDate = c.OpenDate.ToString("yyyy-MM-dd"),
                        CloseDate = c.CloseDate.HasValue ? c.CloseDate.Value.ToString("yyyy-MM-dd") : null,
                        CourtName = c.Juridiction.Name,
                        c.CourtCaseNumber,
                        c.OpposingParty,
                        c.OpposingCounsel,
                        NextHearingDate = c.NextHearingDate.HasValue ? c.NextHearingDate.Value.ToString("yyyy-MM-dd") : null,
                        c.Notes,
                        LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.User.FirstName + " " + c.AssignedLawyer.User.LastName : null,
                        LawyerEmail = c.AssignedLawyer != null ? c.AssignedLawyer.User.Email : null
                    })
                    .FirstOrDefaultAsync();

                if (caseData == null)
                {
                    return NotFound(new { message = $"Case with ID {caseId} not found" });
                }

                return Ok(caseData);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting case data for AI assistant");
                return StatusCode(500, new { message = "Failed to get case data" });
            }
        }

        /// <summary>
        /// Get suggestions for integrating client/case information
        /// </summary>
        [HttpPost("suggest-info-integration")]
        public async Task<ActionResult<IEnumerable<AISuggestion>>> SuggestInfoIntegration([FromBody] InfoIntegrationRequest model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                object clientData = null;
                object caseData = null;

                // Get client data if provided
                if (model.ClientId.HasValue)
                {
                    var client = await _context.Clients
                        .Where(c => c.ClientId == model.ClientId.Value)
                        .Select(c => new
                        {
                            c.ClientId,
                            c.FirstName,
                            c.LastName,
                            c.Email,
                            c.PhoneNumber,
                            c.Address,
                            Type = c.Type.ToString(),
                            c.CompanyName,
                            c.TaxId,
                            c.IdNumber,
                            FullName = c.FirstName + " " + c.LastName
                        })
                        .FirstOrDefaultAsync();

                    if (client != null)
                    {
                        clientData = client;
                    }
                }

                // Get case data if provided
                if (model.CaseId.HasValue)
                {
                    var caseInfo = await _context.Cases
                        .Include(c => c.AssignedLawyer)
                            .ThenInclude(l => l.User)
                        .Where(c => c.CaseId == model.CaseId.Value)
                        .Select(c => new
                        {
                            c.CaseId,
                            c.CaseNumber,
                            c.Title,
                            c.Description,
                            Type = c.Type.ToString(),
                            Status = c.Status.ToString(),
                            OpenDate = c.OpenDate.ToString("yyyy-MM-dd"),
                            CloseDate = c.CloseDate.HasValue ? c.CloseDate.Value.ToString("yyyy-MM-dd") : null,
                            Juridiction = new Juridiction
                            {
                                Id = c.Juridiction.Id,
                                Name = c.Juridiction.Name,
                                Portal_Identifier = c.Juridiction.Portal_Identifier
                            },
                            c.CourtCaseNumber,
                            c.OpposingParty,
                            c.OpposingCounsel,
                            NextHearingDate = c.NextHearingDate.HasValue ? c.NextHearingDate.Value.ToString("yyyy-MM-dd") : null,
                            c.Notes,
                            LawyerName = c.AssignedLawyer != null ? c.AssignedLawyer.User.FirstName + " " + c.AssignedLawyer.User.LastName : null,
                            LawyerEmail = c.AssignedLawyer != null ? c.AssignedLawyer.User.Email : null
                        })
                        .FirstOrDefaultAsync();

                    if (caseInfo != null)
                    {
                        caseData = caseInfo;
                    }
                }

                var suggestions = await _geminiService.SuggestEntityInfoIntegrationAsync(
                    model.Content,
                    clientData,
                    caseData);

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating info integration suggestions");
                return StatusCode(500, new { message = "Failed to generate info integration suggestions" });
            }
        }

        /// <summary>
        /// Generate AI completion based on prompt
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<CompletionResponse>> GenerateCompletion([FromBody] CompletionRequest model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Prompt))
                {
                    return BadRequest(new { message = "Prompt is required" });
                }

                var completion = await _geminiService.GenerateCompletionAsync(model.Prompt);

                return Ok(new CompletionResponse
                {
                    Prompt = model.Prompt,
                    Completion = completion
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI completion");
                return StatusCode(500, new { message = "Failed to generate AI completion" });
            }
        }
    }

    #region Request/Response Models

    public class DocumentContentModel
    {
        public string Content { get; set; }
        public string Language { get; set; }
    }

    public class TranslationRequest
    {
        public string Content { get; set; }
        public string TargetLanguage { get; set; }
    }

    public class TranslationResponse
    {
        public string OriginalContent { get; set; }
        public string TranslatedContent { get; set; }
        public string TargetLanguage { get; set; }
    }

    public class SummaryRequest
    {
        public string Content { get; set; }
        public int? MaxLength { get; set; }
    }

    public class SummaryResponse
    {
        public string OriginalContent { get; set; }
        public string Summary { get; set; }
    }

    public class InfoIntegrationRequest
    {
        public string Content { get; set; }
        public int? ClientId { get; set; }
        public int? CaseId { get; set; }
    }

    public class CompletionRequest
    {
        public string Prompt { get; set; }
    }

    public class CompletionResponse
    {
        public string Prompt { get; set; }
        public string Completion { get; set; }
    }

    #endregion
}