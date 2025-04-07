using DocumentGeneratorAPI.Models;
using DocumentGeneratorAPI.Services;
using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models.Extras;

namespace DocumentGeneratorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly DocumentService _documentService;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            DocumentService documentService,
            ILogger<DocumentsController> logger)
        {
            _documentService = documentService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a document from a template
        /// </summary>
        [HttpPost("generate")]
        public async Task<ActionResult<GenerationResponse>> GenerateDocument([FromBody] GenerationRequest request)
        {
            try
            {
                _logger.LogInformation("Received document generation request for template: {TemplateId}", request.TemplateId);

                if (request == null)
                {
                    return BadRequest("Request body cannot be null");
                }

                // Validate required fields
                if (string.IsNullOrEmpty(request.TemplateId))
                {
                    return BadRequest("Template ID is required");
                }

                if (string.IsNullOrEmpty(request.DocumentTitle))
                {
                    return BadRequest("Document title is required");
                }

                // Generate the document
                var response = await _documentService.GenerateDocumentAsync(request);

                if (!string.IsNullOrEmpty(response.Error))
                {
                    return BadRequest(response);
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get all documents
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocuments()
        {
            try
            {
                var documents = await _documentService.GetDocumentsAsync();
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documents");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get a document by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<Document>> GetDocument(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Document ID is required");
                }

                var document = await _documentService.GetDocumentAsync(id);
                return Ok(document);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Document with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document: {DocumentId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Download a document
        /// </summary>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Document ID is required");
                }

                var (content, contentType, fileName) = await _documentService.DownloadDocumentAsync(id);
                return File(content, contentType, fileName);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Document with ID {id} not found");
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document: {DocumentId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Delete a document
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(string id)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Document ID is required");
                }

                var result = await _documentService.DeleteDocumentAsync(id);
                if (!result)
                {
                    return NotFound($"Document with ID {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting document: {DocumentId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Get documents by template ID
        /// </summary>
        [HttpGet("bytemplate/{templateId}")]
        public async Task<ActionResult<IEnumerable<Document>>> GetDocumentsByTemplate(string templateId)
        {
            try
            {
                if (string.IsNullOrEmpty(templateId))
                {
                    return BadRequest("Template ID is required");
                }

                var documents = await _documentService.GetDocumentsByTemplateAsync(templateId);
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documents by template: {TemplateId}", templateId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Search documents by keyword
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Document>>> SearchDocuments([FromQuery] string keyword)
        {
            try
            {
                if (string.IsNullOrEmpty(keyword))
                {
                    return BadRequest("Search keyword is required");
                }

                var documents = await _documentService.SearchDocumentsAsync(keyword);
                return Ok(documents);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching documents with keyword: {Keyword}", keyword);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Update document content
        /// </summary>
        [HttpPut("{id}/content")]
        public async Task<ActionResult<Document>> UpdateDocumentContent(string id, [FromBody] string content)
        {
            try
            {
                if (string.IsNullOrEmpty(id))
                {
                    return BadRequest("Document ID is required");
                }

                if (string.IsNullOrEmpty(content))
                {
                    return BadRequest("Document content is required");
                }

                var updatedDocument = await _documentService.UpdateDocumentContentAsync(id, content);
                return Ok(updatedDocument);
            }
            catch (KeyNotFoundException)
            {
                return NotFound($"Document with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating document content: {DocumentId}", id);
                return StatusCode(500, new { error = ex.Message });
            }
        }
    }
}