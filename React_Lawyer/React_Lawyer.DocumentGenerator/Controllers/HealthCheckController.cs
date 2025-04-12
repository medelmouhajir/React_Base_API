using DocumentGeneratorAPI.Models;
using DocumentGeneratorAPI.Services;
using Microsoft.AspNetCore.Mvc;
using React_Lawyer.DocumentGenerator.Models.Extras;

namespace DocumentGeneratorAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HealthCheckController : ControllerBase
    {
        private readonly TemplateService _templateService;
        private readonly DocumentService _documentService;
        private readonly ILogger<HealthCheckController> _logger;

        public HealthCheckController(
            TemplateService templateService,
            DocumentService documentService,
            ILogger<HealthCheckController> logger)
        {
            _templateService = templateService;
            _documentService = documentService;
            _logger = logger;
        }

        /// <summary>
        /// Tests template creation functionality
        /// </summary>
        [HttpGet("template")]
        public async Task<IActionResult> CheckTemplateCreation()
        {
            try
            {
                _logger.LogInformation("Running health check: Template creation");

                // Create a test template
                var testTemplate = new Template
                {
                    Name = "Health Check Template",
                    Description = "Template for health check testing",
                    Category = "Test",
                    Content = "This is a test template with a variable: {{TestVariable}}",
                    Language = "en",
                    Jurisdiction = "Test"
                };

                // Save the template
                var savedTemplate = await _templateService.SaveTemplateAsync(testTemplate);

                // Verify the template was created successfully
                if (string.IsNullOrEmpty(savedTemplate.Id))
                {
                    return StatusCode(500, new { status = "failed", message = "Template ID was not generated" });
                }

                // Extract variables
                var variables = _templateService.ExtractVariablesFromContent(savedTemplate.Content);
                if (!variables.Contains("TestVariable"))
                {
                    return StatusCode(500, new { status = "failed", message = "Variable extraction failed" });
                }

                return Ok(new
                {
                    status = "healthy",
                    message = "Template creation successful",
                    templateId = savedTemplate.Id,
                    variables = variables
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed: Template creation");
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    message = $"Template creation failed: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Tests document generation functionality
        /// </summary>
        [HttpGet("document")]
        public async Task<IActionResult> CheckDocumentGeneration()
        {
            try
            {
                _logger.LogInformation("Running health check: Document generation");

                // Create a test template first
                var testTemplate = new Template
                {
                    Name = "Health Check Document Template",
                    Description = "Template for document generation testing",
                    Category = "Test",
                    Content = "This is a test document.\n\nClient Name: {{ClientName}}\nDate: {{Date}}\n\nThis document was generated as part of a health check.",
                    Language = "en",
                    Jurisdiction = "Test"
                };

                // Save the template
                var savedTemplate = await _templateService.SaveTemplateAsync(testTemplate);

                // Generate a document using the template
                var generationRequest = new GenerationRequest
                {
                    TemplateId = savedTemplate.Id,
                    DocumentTitle = "Health Check Document",
                    Format = DocumentGeneratorAPI.Models.DocumentFormat.TXT,
                    UserId = "healthcheck"
                };

                var generationResponse = await _documentService.GenerateDocumentAsync(generationRequest);

                // Check for errors
                if (!string.IsNullOrEmpty(generationResponse.Error))
                {
                    return StatusCode(500, new
                    {
                        status = "unhealthy",
                        message = $"Document generation failed: {generationResponse.Error}"
                    });
                }

                return Ok(new
                {
                    status = "healthy",
                    message = "Document generation successful",
                    documentId = generationResponse.DocumentId,
                    documentUrl = generationResponse.Url,
                    contentPreview = generationResponse.Content.Length > 100
                        ? generationResponse.Content.Substring(0, 100) + "..."
                        : generationResponse.Content
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed: Document generation");
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    message = $"Document generation failed: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// Tests document download functionality
        /// </summary>
        [HttpGet("download")]
        public async Task<IActionResult> CheckDocumentDownload()
        {
            try
            {
                _logger.LogInformation("Running health check: Document download");

                // Create a test template first
                var testTemplate = new Template
                {
                    Name = "Health Check Download Template",
                    Description = "Template for document download testing",
                    Category = "Test",
                    Content = "# Health Check Document\n\n## Test Download\n\nThis document was generated on {{Date}}.\n\nIt contains test content for {{Purpose}}.\n\n---\n\nGenerated by DocumentGeneratorAPI Health Check",
                    Language = "en",
                    Jurisdiction = "Test"
                };

                // Save the template
                var savedTemplate = await _templateService.SaveTemplateAsync(testTemplate);

                // Generate a document using the template
                var generationRequest = new GenerationRequest
                {
                    TemplateId = savedTemplate.Id,
                    DocumentTitle = "Health Check Download",
                    Format = DocumentGeneratorAPI.Models.DocumentFormat.Markdown,
                    UserId = "healthcheck"
                };

                var generationResponse = await _documentService.GenerateDocumentAsync(generationRequest);

                // Check for errors
                if (!string.IsNullOrEmpty(generationResponse.Error))
                {
                    return StatusCode(500, new
                    {
                        status = "unhealthy",
                        message = $"Document generation failed: {generationResponse.Error}"
                    });
                }

                // Download the document
                var (content, contentType, fileName) = await _documentService.DownloadDocumentAsync(generationResponse.DocumentId);

                // Return the file
                return File(content, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed: Document download");
                return StatusCode(500, new
                {
                    status = "unhealthy",
                    message = $"Document download failed: {ex.Message}"
                });
            }
        }
    }
}