using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Lawyer.Server.Data;
using React_Lawyer.Server.Models.DocumentGeneration;
using React_Lawyer.Server.Services.DocumentGeneration;
using Shared_Models.Cases;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace React_Lawyer.Server.Controllers
{
    [Route("api/smart-editor")]
    [ApiController]
    [Authorize]
    public class SmartEditorController : ControllerBase
    {
        private readonly DocumentGenerationService _documentGenerationService;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SmartEditorController> _logger;
        private readonly IWebHostEnvironment _env;

        public SmartEditorController(
            DocumentGenerationService documentGenerationService,
            ApplicationDbContext context,
            ILogger<SmartEditorController> logger,
            IWebHostEnvironment env)
        {
            _documentGenerationService = documentGenerationService;
            _context = context;
            _logger = logger;
            _env = env;
        }

        // GET: api/smart-editor/templates
        [HttpGet("templates")]
        public async Task<ActionResult<IEnumerable<DocumentTemplate>>> GetTemplates()
        {
            try
            {
                var templates = await _documentGenerationService.GetTemplatesAsync();
                return Ok(templates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document templates");
                return StatusCode(500, new { message = "Failed to fetch document templates" });
            }
        }

        // GET: api/smart-editor/templates/{id}
        [HttpGet("templates/{id}")]
        public async Task<ActionResult<DocumentTemplate>> GetTemplate(string id)
        {
            try
            {
                var templates = await _documentGenerationService.GetTemplatesAsync();
                var template = templates.FirstOrDefault(t => t.Id == id);

                if (template == null)
                {
                    return NotFound(new { message = $"Template with ID {id} not found" });
                }

                return Ok(template);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document template {TemplateId}", id);
                return StatusCode(500, new { message = $"Failed to fetch document template {id}" });
            }
        }

        // GET: api/smart-editor/documents/{id}
        [HttpGet("documents/{id}")]
        public async Task<ActionResult<Document>> GetDocument(int id)
        {
            try
            {
                var document = await _context.Documents
                    .Include(d => d.UploadedBy)
                    .Include(d => d.Case)
                    .FirstOrDefaultAsync(d => d.DocumentId == id);

                if (document == null)
                {
                    return NotFound(new { message = $"Document with ID {id} not found" });
                }

                // Check user has access to this document
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var userRole = User.FindFirst("Role")?.Value;
                var userFirmId = await _context.Users
                    .Include(x => x.Lawyer)
                    .Include(x => x.Secretary)
                    .Include(x => x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (document.Case.LawFirmId != userFirmId)
                {
                    return Forbid();
                }

                // Return document data
                return Ok(new
                {
                    document.DocumentId,
                    document.Title,
                    document.Description,
                    document.UploadDate,
                    document.LastModified,
                    Category = document.Category.ToString(),
                    Content = System.IO.File.Exists(document.FilePath)
                        ? await System.IO.File.ReadAllTextAsync(document.FilePath)
                        : "",
                    UploadedBy = new
                    {
                        document.UploadedBy.UserId,
                        document.UploadedBy.FirstName,
                        document.UploadedBy.LastName
                    },
                    Case = new
                    {
                        document.Case.CaseId,
                        document.Case.Title
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document {DocumentId}", id);
                return StatusCode(500, new { message = $"Failed to fetch document {id}" });
            }
        }

        // POST: api/smart-editor/documents
        [HttpPost("documents")]
        public async Task<ActionResult<Document>> CreateDocument([FromBody] SmartEditorDocumentModel model)
        {
            try
            {
                if (model == null || string.IsNullOrEmpty(model.Title) || string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document title and content are required" });
                }

                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);

                // Validate case if provided
                if (model.CaseId.HasValue)
                {
                    var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == model.CaseId.Value);
                    if (!caseExists)
                    {
                        return BadRequest(new { message = "The specified case does not exist" });
                    }
                }
                else
                {
                    // Get the first active case for the user's firm as default
                    var userFirmId = await _context.Users
                        .Include(x => x.Lawyer)
                        .Include(x => x.Secretary)
                        .Include(x => x.Admin)
                        .Where(u => u.UserId == currentUserId)
                        .Select(u => u.GetLawFirmId())
                        .FirstOrDefaultAsync();

                    var defaultCase = await _context.Cases
                        .Where(c => c.LawFirmId == userFirmId && c.Status != CaseStatus.Closed && c.Status != CaseStatus.Archived)
                        .OrderByDescending(c => c.OpenDate)
                        .FirstOrDefaultAsync();

                    if (defaultCase != null)
                    {
                        model.CaseId = defaultCase.CaseId;
                    }
                    else
                    {
                        return BadRequest(new { message = "A case ID is required when no active cases exist" });
                    }
                }

                // Create file storage directory if it doesn't exist
                var uploadsFolder = Path.Combine(_env.ContentRootPath, "Uploads");
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Create case directory if it doesn't exist
                var caseFolder = Path.Combine(uploadsFolder, $"Case_{model.CaseId}");
                if (!Directory.Exists(caseFolder))
                {
                    Directory.CreateDirectory(caseFolder);
                }

                // Create unique filename
                string fileName = $"smart_editor_{DateTime.UtcNow:yyyyMMdd_HHmmss}_{Guid.NewGuid():N}.html";
                string filePath = Path.Combine(caseFolder, fileName);

                // Save content to file
                await System.IO.File.WriteAllTextAsync(filePath, model.Content, Encoding.UTF8);

                // Create document entry
                var document = new Document
                {
                    CaseId = model.CaseId.Value,
                    UploadedById = currentUserId,
                    Title = model.Title,
                    Description = "Created with Smart Editor",
                    FilePath = filePath,
                    FileType = "text/html",
                    FileSize = Encoding.UTF8.GetByteCount(model.Content),
                    UploadDate = DateTime.UtcNow,
                    LastModified = DateTime.UtcNow,
                    Category = DocumentCategory.Other,
                    IsConfidential = false,
                    IsTemplate = false,
                    IsSharedWithClient = false,
                    Tags = "",
                    VersionNumber = 1,
                    LawFirmId = model.lawFirmId,
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Created smart editor document: {DocumentId} - {Title} by user {UserId}",
                    document.DocumentId, document.Title, currentUserId);

                return CreatedAtAction(nameof(GetDocument), new { id = document.DocumentId }, new
                {
                    document.DocumentId,
                    document.Title,
                    document.Description,
                    document.UploadDate,
                    document.LastModified,
                    Category = document.Category.ToString(),
                    Content = model.Content
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating smart editor document");
                return StatusCode(500, new { message = "Failed to create document" });
            }
        }

        // PUT: api/smart-editor/documents/{id}
        [HttpPut("documents/{id}")]
        public async Task<IActionResult> UpdateDocument(int id, [FromBody] SmartEditorDocumentUpdateModel model)
        {
            try
            {
                if (model == null || string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                var document = await _context.Documents
                    .Include(d => d.Case)
                    .FirstOrDefaultAsync(d => d.DocumentId == id);

                if (document == null)
                {
                    return NotFound(new { message = $"Document with ID {id} not found" });
                }

                // Check user has access to this document
                int currentUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var userFirmId = await _context.Users
                    .Include(x => x.Lawyer)
                    .Include(x => x.Secretary)
                    .Include(x => x.Admin)
                    .Where(u => u.UserId == currentUserId)
                    .Select(u => u.GetLawFirmId())
                    .FirstOrDefaultAsync();

                if (document.Case.LawFirmId != userFirmId)
                {
                    return Forbid();
                }

                // Update document properties
                if (!string.IsNullOrEmpty(model.Title))
                {
                    document.Title = model.Title;
                }


                document.LastModified = DateTime.UtcNow;
                document.FileSize = Encoding.UTF8.GetByteCount(model.Content);

                // Save updated content to file
                await System.IO.File.WriteAllTextAsync(document.FilePath, model.Content, Encoding.UTF8);

                // Save changes to database
                _context.Entry(document).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated smart editor document: {DocumentId} by user {UserId}",
                    document.DocumentId, currentUserId);

                return Ok(new object());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating smart editor document {DocumentId}", id);
                return StatusCode(500, new { message = $"Failed to update document {id}" });
            }
        }

        // POST: api/smart-editor/documents/export
        [HttpPost("documents/export")]
        public async Task<IActionResult> ExportDocument([FromBody] DocumentExportModel model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Format))
                {
                    model.Format = "pdf"; // Default to PDF
                }

                // Get document content
                string content;
                if (model.DocumentId.HasValue)
                {
                    // Load from saved document
                    var document = await _context.Documents.FindAsync(model.DocumentId.Value);
                    if (document == null)
                    {
                        return NotFound(new { message = $"Document with ID {model.DocumentId} not found" });
                    }

                    content = System.IO.File.Exists(document.FilePath)
                        ? await System.IO.File.ReadAllTextAsync(document.FilePath)
                        : "";

                    if (string.IsNullOrEmpty(model.Title))
                    {
                        model.Title = document.Title;
                    }
                }
                else if (!string.IsNullOrEmpty(model.Content))
                {
                    // Use provided content
                    content = model.Content;
                }
                else
                {
                    return BadRequest(new { message = "Either documentId or content must be provided" });
                }

                // Use document generation service to convert to the requested format
                var generationRequest = new DocumentGenerationRequest
                {
                    DocumentTitle = model.Title ?? "Exported Document",
                    Format = model.Format.ToUpper(),
                    UserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value),
                    Data = new { content }
                };

                var result = await _documentGenerationService.GenerateDocumentAsync(generationRequest);

                if (!string.IsNullOrEmpty(result.Error))
                {
                    return BadRequest(new { message = result.Error });
                }

                // Download the generated document
                var (fileContent, contentType, fileName) = await _documentGenerationService.DownloadDocumentAsync(result.DocumentId);

                return File(fileContent, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting document");
                return StatusCode(500, new { message = "Failed to export document" });
            }
        }

        // POST: api/smart-editor/ai/suggestions
        [HttpPost("ai/suggestions")]
        public async Task<ActionResult<IEnumerable<AISuggestion>>> GetAISuggestions([FromBody] AIAnalysisModel model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Content))
                {
                    return BadRequest(new { message = "Document content is required" });
                }

                // In a real implementation, you would call an AI service
                // For this demo, we'll return mock suggestions
                var suggestions = new List<AISuggestion>
                {
                    new AISuggestion
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "clarity",
                        Original = "The party of the first part shall hereafter be referred to as the seller.",
                        Suggested = "The seller agrees to the following terms.",
                        Explanation = "Simplified language for better readability."
                    },
                    new AISuggestion
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "legal",
                        Original = "The buyer will pay within 30 days.",
                        Suggested = "The buyer shall make payment in full within thirty (30) days of receipt of invoice.",
                        Explanation = "Added legal precision and clarity to payment terms."
                    },
                    new AISuggestion
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "grammar",
                        Original = "Both party's responsibilities are defined herein.",
                        Suggested = "Both parties' responsibilities are defined herein.",
                        Explanation = "Corrected plural possessive form."
                    },
                    new AISuggestion
                    {
                        Id = Guid.NewGuid().ToString(),
                        Type = "style",
                        Original = "We think that this contract will be beneficial.",
                        Suggested = "This contract provides mutual benefits to all parties.",
                        Explanation = "Removed first person and strengthened statement."
                    }
                };

                return Ok(suggestions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI suggestions");
                return StatusCode(500, new { message = "Failed to generate AI suggestions" });
            }
        }

        // POST: api/smart-editor/ai/generate
        [HttpPost("ai/generate")]
        public async Task<ActionResult<AICompletionResponse>> GenerateAICompletion([FromBody] AICompletionRequest model)
        {
            try
            {
                if (string.IsNullOrEmpty(model.Prompt))
                {
                    return BadRequest(new { message = "Prompt is required" });
                }

                // In a real implementation, you would call an AI service
                // For this demo, we'll return mock completions
                string completion;
                if (model.Prompt.Contains("clause", StringComparison.OrdinalIgnoreCase))
                {
                    completion = "Force Majeure Clause: Neither party shall be liable for any failure or delay in performance under this Agreement to the extent said failures or delays are proximately caused by causes beyond that party's reasonable control and occurring without its fault or negligence.";
                }
                else if (model.Prompt.Contains("summar", StringComparison.OrdinalIgnoreCase))
                {
                    completion = "This agreement establishes a partnership between Company A and Company B for the joint development and marketing of Product X. Key points include revenue sharing (60/40 split), intellectual property rights, and a 2-year initial term with options for renewal.";
                }
                else
                {
                    completion = "I can help you draft legal language, summarize documents, suggest improvements, or generate new content for your document. What specific legal text would you like me to help with?";
                }

                return Ok(new AICompletionResponse
                {
                    Completion = completion,
                    TokensUsed = completion.Length / 4, // Mock token count
                    Prompt = model.Prompt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating AI completion");
                return StatusCode(500, new { message = "Failed to generate AI completion" });
            }
        }
    }

    public class SmartEditorDocumentModel
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public string templateId { get; set; }
        public int lawFirmId { get; set; }
        public int? CaseId { get; set; }
        public int? ClientId { get; set; }
    }
    public class SmartEditorDocumentUpdateModel
    {
        public string Title { get; set; }
        public string Content { get; set; }
        public int? CaseId { get; set; }
        public int? ClientId { get; set; }
    }

    public class DocumentExportModel
    {
        public int? DocumentId { get; set; }
        public string Content { get; set; }
        public string Title { get; set; }
        public string Format { get; set; } = "pdf";
    }

    public class AIAnalysisModel
    {
        public string Content { get; set; }
        public string Language { get; set; } = "en";
    }

    public class AISuggestion
    {
        public string Id { get; set; }
        public string Type { get; set; }
        public string Original { get; set; }
        public string Suggested { get; set; }
        public string Explanation { get; set; }
    }

    public class AICompletionRequest
    {
        public string Prompt { get; set; }
        public string Context { get; set; }
        public string Language { get; set; } = "en";
    }

    public class AICompletionResponse
    {
        public string Completion { get; set; }
        public int TokensUsed { get; set; }
        public string Prompt { get; set; }
    }
}