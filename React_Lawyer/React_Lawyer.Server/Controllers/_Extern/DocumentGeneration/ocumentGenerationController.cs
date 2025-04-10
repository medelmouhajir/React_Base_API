// React_Lawyer.Server/Controllers/Documents/DocumentGenerationController.cs
using Microsoft.AspNetCore.Mvc;
using React_Lawyer.Server.Models.DocumentGeneration;
using React_Lawyer.Server.Services.DocumentGeneration;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Extensions.Logging;

namespace React_Lawyer.Server.Controllers.Documents
{
    [Route("api/document-generation")]
    [ApiController]
    public class DocumentGenerationController : ControllerBase
    {
        private readonly DocumentGenerationService _documentGenerationService;
        private readonly ILogger<DocumentGenerationController> _logger;

        public DocumentGenerationController(
            DocumentGenerationService documentGenerationService,
            ILogger<DocumentGenerationController> logger)
        {
            _documentGenerationService = documentGenerationService;
            _logger = logger;
        }

        /// <summary>
        /// Get all available document templates
        /// </summary>
        [HttpGet("templates")]
        public async Task<ActionResult<IEnumerable<DocumentTemplate>>> GetTemplates([FromQuery] string category = null)
        {
            try
            {
                if (string.IsNullOrEmpty(category))
                {
                    var templates = await _documentGenerationService.GetTemplatesAsync();
                    return Ok(templates);
                }
                else
                {
                    var templates = await _documentGenerationService.GetTemplatesByCategoryAsync(category);
                    return Ok(templates);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Generate a document using the specified template and data
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<DocumentGenerationResponse>> GenerateDocument([FromBody] DocumentGenerationRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { message = "Request body cannot be null" });
                }

                if (string.IsNullOrEmpty(request.TemplateId))
                {
                    return BadRequest(new { message = "Template ID is required" });
                }

                if (string.IsNullOrEmpty(request.DocumentTitle))
                {
                    return BadRequest(new { message = "Document title is required" });
                }

                // Set the UserID from token if not provided
                if (request.UserId <= 0)
                {
                    request.UserId = GetUserIdFromToken();
                }

                // If data is not provided but CaseId is, try to auto-populate data
                if (request.Data == null && request.CaseId.HasValue)
                {
                    request.Data = await _documentGenerationService.GetCaseDocumentDataAsync(request.CaseId.Value);
                }
                // If data is not provided but ClientId is, try to auto-populate data
                else if (request.Data == null && request.ClientId.HasValue)
                {
                    request.Data = await _documentGenerationService.GetClientDocumentDataAsync(request.ClientId.Value);
                }

                var response = await _documentGenerationService.GenerateDocumentAsync(request);
                return Ok(response);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Download a generated document
        /// </summary>
        [HttpGet("documents/{documentId}/download")]
        public async Task<IActionResult> DownloadDocument(string documentId)
        {
            try
            {
                if (string.IsNullOrEmpty(documentId))
                {
                    return BadRequest(new { message = "Document ID is required" });
                }

                var (content, contentType, fileName) = await _documentGenerationService.DownloadDocumentAsync(documentId);
                return File(content, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentId}", documentId);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get data for a case document
        /// </summary>
        [HttpGet("data/case/{caseId}")]
        public async Task<ActionResult<object>> GetCaseDocumentData(int caseId)
        {
            try
            {
                var data = await _documentGenerationService.GetCaseDocumentDataAsync(caseId);
                return Ok(data);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document data for case {CaseId}", caseId);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get data for a client document
        /// </summary>
        [HttpGet("data/client/{clientId}")]
        public async Task<ActionResult<object>> GetClientDocumentData(int clientId)
        {
            try
            {
                var data = await _documentGenerationService.GetClientDocumentDataAsync(clientId);
                return Ok(data);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document data for client {ClientId}", clientId);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get the user ID from the authentication token
        /// </summary>
        private int GetUserIdFromToken()
        {
            // In a real scenario, you would extract this from the JWT token
            // For now, return a placeholder
            return 1; // Default user ID if not found
        }
    }
}