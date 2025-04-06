using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models;
using React_Lawyer.DocumentGenerator.Services;

namespace React_Lawyer.DocumentGenerator.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly DocumentGenerationService _generationService;
        private readonly StorageService _storageService;
        private readonly ILogger<DocumentsController> _logger;

        public DocumentsController(
            DocumentGenerationService generationService,
            StorageService storageService,
            ILogger<DocumentsController> logger)
        {
            _generationService = generationService;
            _storageService = storageService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a document synchronously
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

                if (request.ClientId <= 0)
                {
                    return BadRequest("Valid Client ID is required");
                }

                if (request.ClientData == null || request.ClientData.Count == 0)
                {
                    return BadRequest("Client data is required");
                }

                // Generate the document
                var response = await _generationService.GenerateDocumentAsync(request);

                // Return appropriate status based on generation result
                if (response.Status == GenerationStatus.Completed)
                {
                    return Ok(response);
                }
                else if (response.Status == GenerationStatus.Failed)
                {
                    return StatusCode(500, response);
                }
                else
                {
                    return StatusCode(202, response); // Accepted but still processing
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Generate a document asynchronously
        /// </summary>
        [HttpPost("generate/async")]
        public async Task<ActionResult<string>> GenerateDocumentAsync([FromBody] GenerationRequest request)
        {
            try
            {
                _logger.LogInformation("Received async document generation request for template: {TemplateId}", request.TemplateId);

                if (request == null)
                {
                    return BadRequest("Request body cannot be null");
                }

                // Validate required fields
                if (string.IsNullOrEmpty(request.TemplateId))
                {
                    return BadRequest("Template ID is required");
                }

                if (request.ClientId <= 0)
                {
                    return BadRequest("Valid Client ID is required");
                }

                if (request.ClientData == null || request.ClientData.Count == 0)
                {
                    return BadRequest("Client data is required");
                }

                // Create a job for asynchronous processing
                var jobId = await _generationService.CreateGenerationJobAsync(request);

                // Return the job ID for status checking
                return Accepted(new { jobId, statusUrl = $"/api/documents/status/{jobId}" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating generation job");
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Check the status of an asynchronous generation job
        /// </summary>
        [HttpGet("status/{jobId}")]
        public async Task<ActionResult<GenerationResponse>> GetJobStatus(string jobId)
        {
            try
            {
                if (string.IsNullOrEmpty(jobId))
                {
                    return BadRequest("Job ID is required");
                }

                var response = await _generationService.GetJobStatusAsync(jobId);

                return Ok(response);
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { error = $"Job with ID {jobId} not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking job status: {JobId}", jobId);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        /// <summary>
        /// Download a generated document
        ///// </summary>
        //[HttpGet("{id}/download")]
        //public async Task<IActionResult> DownloadDocument(string id)
        //{
        //    try
        //    {
        //        if (string.IsNullOrEmpty(id))
        //        {
        //            return BadRequest("Document ID is required");
        //        }

        //        // Retrieve the document from storage
        //        var document = await _generationService.GetDocumentAsync(id);
        //        if (document == null)
        //        {
        //            return NotFound($"Document with ID {id} not found");
        //        }

        //        var documentBytes = await _storageService.GetDocumentAsync(document.StoragePath);

        //        // Determine the content type based on document format
        //        var contentType = document.Format switch
        //        {
        //            DocumentFormat.PDF => "application/pdf",
        //            DocumentFormat.DOCX => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        //            DocumentFormat.HTML => "text/html",
        //            DocumentFormat.Markdown => "text/markdown",
        //            DocumentFormat.RTF => "application/rtf",
        //            DocumentFormat.TXT => "text/plain",
        //            _ => "application/octet-stream"
        //        };

        //        // Return the file with the appropriate content type
        //        return File(documentBytes, contentType, $"{document.Title}.{document.Format.ToString().ToLowerInvariant()}");
        //    }
        //    catch (FileNotFoundException)
        //    {
        //        return NotFound("Document file not found");
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error downloading document: {DocumentId}", id);
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        /// <summary>
        /// Get documents by client ID
        ///// </summary>
        //[HttpGet("client/{clientId}")]
        //public async Task<ActionResult<IEnumerable<Document>>> GetDocumentsByClient(int clientId)
        //{
        //    try
        //    {
        //        if (clientId <= 0)
        //        {
        //            return BadRequest("Valid Client ID is required");
        //        }

        //        var documents = await _generationService.GetDocumentsByClientAsync(clientId);
        //        return Ok(documents);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting documents for client: {ClientId}", clientId);
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        /// <summary>
        /// Get documents by case ID
        ///// </summary>
        //[HttpGet("case/{caseId}")]
        //public async Task<ActionResult<IEnumerable<Document>>> GetDocumentsByCase(int caseId)
        //{
        //    try
        //    {
        //        if (caseId <= 0)
        //        {
        //            return BadRequest("Valid Case ID is required");
        //        }

        //        var documents = await _generationService.GetDocumentsByCaseAsync(caseId);
        //        return Ok(documents);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting documents for case: {CaseId}", caseId);
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        /// <summary>
        /// Get a document by ID
        ///// </summary>
        //[HttpGet("{id}")]
        //public async Task<ActionResult<Document>> GetDocument(string id)
        //{
        //    try
        //    {
        //        if (string.IsNullOrEmpty(id))
        //        {
        //            return BadRequest("Document ID is required");
        //        }

        //        var document = await _generationService.GetDocumentAsync(id);
        //        if (document == null)
        //        {
        //            return NotFound($"Document with ID {id} not found");
        //        }

        //        return Ok(document);
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting document: {DocumentId}", id);
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}

        /// <summary>
        /// Delete a document
        ///// </summary>
        //[HttpDelete("{id}")]
        //public async Task<IActionResult> DeleteDocument(string id)
        //{
        //    try
        //    {
        //        if (string.IsNullOrEmpty(id))
        //        {
        //            return BadRequest("Document ID is required");
        //        }

        //        var result = await _generationService.DeleteDocumentAsync(id);
        //        if (!result)
        //        {
        //            return NotFound($"Document with ID {id} not found");
        //        }

        //        return NoContent();
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error deleting document: {DocumentId}", id);
        //        return StatusCode(500, new { error = ex.Message });
        //    }
        //}
    }
}
