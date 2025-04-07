using DocumentGeneratorAPI.Data.Repositories;
using DocumentGeneratorAPI.Models;
using React_Lawyer.DocumentGenerator.Models.Extras;
using System.Text;

namespace DocumentGeneratorAPI.Services
{
    public class DocumentService
    {
        private readonly IDocumentRepository _documentRepository;
        private readonly TemplateService _templateService;
        private readonly GeminiService _geminiService;
        private readonly StorageService _storageService;
        private readonly ILogger<DocumentService> _logger;

        public DocumentService(
            IDocumentRepository documentRepository,
            TemplateService templateService,
            GeminiService geminiService,
            StorageService storageService,
            ILogger<DocumentService> logger)
        {
            _documentRepository = documentRepository;
            _templateService = templateService;
            _geminiService = geminiService;
            _storageService = storageService;
            _logger = logger;
        }

        /// <summary>
        /// Generate a document from a template using the provided variables
        /// </summary>
        public async Task<GenerationResponse> GenerateDocumentAsync(GenerationRequest request)
        {
            _logger.LogInformation("Starting document generation for template {TemplateId}", request.TemplateId);

            try
            {
                // Get the template
                var template = await _templateService.GetTemplateAsync(request.TemplateId);

                // Validate variables
                var (isValid, missingVariables) = _templateService.ValidateVariables(template.Content, request.Variables);
                if (!isValid)
                {
                    var missingList = string.Join(", ", missingVariables);
                    _logger.LogWarning("Missing variables for template {TemplateId}: {MissingVariables}", request.TemplateId, missingList);
                    return new GenerationResponse
                    {
                        Error = $"Missing required variables: {missingList}"
                    };
                }

                // Generate document content using Gemini
                string generatedContent = await _geminiService.GenerateDocumentAsync(template, request.Variables);

                // Create document record
                var document = new Document
                {
                    Title = request.DocumentTitle,
                    TemplateId = template.Id,
                    Content = generatedContent,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = request.UserId,
                    Format = request.Format,
                    Size = Encoding.UTF8.GetByteCount(generatedContent),
                    Metadata = new Dictionary<string, string>
                    {
                        { "TemplateName", template.Name },
                        { "TemplateCategory", template.Category },
                        { "GeneratedAt", DateTime.UtcNow.ToString("o") }
                    }
                };

                // Convert content to the requested format
                var (fileBytes, extension) = FormatDocument(generatedContent, request.Format);
                document.Size = fileBytes.Length;

                // Store the document file
                document.StoragePath = await _storageService.StoreDocumentAsync(fileBytes, document.Id, extension);
                document.Url = _storageService.GetDocumentUrl(document.StoragePath);

                // Save the document record
                await _documentRepository.SaveAsync(document);

                _logger.LogInformation("Document generation completed successfully: {DocumentId}", document.Id);

                // Return response
                return new GenerationResponse
                {
                    DocumentId = document.Id,
                    Title = document.Title,
                    Url = document.Url,
                    Format = document.Format,
                    GeneratedAt = document.CreatedAt,
                    Size = document.Size,
                    Content = document.Content,
                    TemplateId = template.Id,
                    TemplateName = template.Name
                };
            }
            catch (KeyNotFoundException ex)
            {
                _logger.LogError(ex, "Template not found: {TemplateId}", request.TemplateId);
                return new GenerationResponse { Error = ex.Message };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document for template {TemplateId}", request.TemplateId);
                return new GenerationResponse { Error = $"Document generation failed: {ex.Message}" };
            }
        }

        /// <summary>
        /// Get a document by ID
        /// </summary>
        public async Task<Document> GetDocumentAsync(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("Document ID cannot be null or empty", nameof(id));
            }

            var document = await _documentRepository.GetByIdAsync(id);

            if (document == null)
            {
                _logger.LogWarning("Document not found: {DocumentId}", id);
                throw new KeyNotFoundException($"Document with ID {id} was not found");
            }

            return document;
        }

        /// <summary>
        /// Get all documents
        /// </summary>
        public async Task<IEnumerable<Document>> GetDocumentsAsync()
        {
            return await _documentRepository.GetAllAsync();
        }

        /// <summary>
        /// Delete a document
        /// </summary>
        public async Task<bool> DeleteDocumentAsync(string id)
        {
            if (string.IsNullOrEmpty(id))
            {
                throw new ArgumentException("Document ID cannot be null or empty", nameof(id));
            }

            var document = await _documentRepository.GetByIdAsync(id);
            if (document == null)
            {
                _logger.LogWarning("Attempt to delete non-existent document: {DocumentId}", id);
                return false;
            }

            // Delete the physical file
            if (!string.IsNullOrEmpty(document.StoragePath))
            {
                _storageService.DeleteDocument(document.StoragePath);
            }

            // Delete the document record
            return await _documentRepository.DeleteAsync(id);
        }

        /// <summary>
        /// Download a document
        /// </summary>
        public async Task<(byte[] Content, string ContentType, string FileName)> DownloadDocumentAsync(string id)
        {
            var document = await GetDocumentAsync(id);

            if (string.IsNullOrEmpty(document.StoragePath))
            {
                throw new InvalidOperationException("Document has no associated file");
            }

            var content = await _storageService.GetDocumentAsync(document.StoragePath);
            var contentType = GetContentType(document.Format);
            var fileName = $"{document.Title}.{GetFileExtension(document.Format)}";

            return (content, contentType, fileName);
        }

        /// <summary>
        /// Search documents by keyword
        /// </summary>
        public async Task<IEnumerable<Document>> SearchDocumentsAsync(string keyword)
        {
            return await _documentRepository.SearchAsync(keyword);
        }

        /// <summary>
        /// Get documents by template ID
        /// </summary>
        public async Task<IEnumerable<Document>> GetDocumentsByTemplateAsync(string templateId)
        {
            return await _documentRepository.GetByTemplateIdAsync(templateId);
        }

        /// <summary>
        /// Update document content
        /// </summary>
        public async Task<Document> UpdateDocumentContentAsync(string id, string content)
        {
            var document = await GetDocumentAsync(id);

            // Update content
            document.Content = content;
            document.Size = Encoding.UTF8.GetByteCount(content);

            // Convert content to the document format
            var (fileBytes, extension) = FormatDocument(content, document.Format);
            document.Size = fileBytes.Length;

            // Store the updated document file
            document.StoragePath = await _storageService.StoreDocumentAsync(fileBytes, document.Id, extension);

            // Save the updated document record
            return await _documentRepository.SaveAsync(document);
        }

        /// <summary>
        /// Convert document content to the requested format
        /// </summary>
        private (byte[] FileBytes, string Extension) FormatDocument(string content, DocumentFormat format)
        {
            // In a real implementation, this would handle conversion to different formats
            // For simplicity, we'll just return the raw text for all formats
            byte[] fileBytes;
            string extension;

            switch (format)
            {
                case DocumentFormat.PDF:
                    // In a real implementation, we would convert to PDF
                    // For now, just return text
                    fileBytes = Encoding.UTF8.GetBytes(content);
                    extension = "pdf";
                    break;
                case DocumentFormat.DOCX:
                    // In a real implementation, we would convert to DOCX
                    fileBytes = Encoding.UTF8.GetBytes(content);
                    extension = "docx";
                    break;
                case DocumentFormat.HTML:
                    fileBytes = Encoding.UTF8.GetBytes(content);
                    extension = "html";
                    break;
                case DocumentFormat.Markdown:
                    fileBytes = Encoding.UTF8.GetBytes(content);
                    extension = "md";
                    break;
                case DocumentFormat.TXT:
                default:
                    fileBytes = Encoding.UTF8.GetBytes(content);
                    extension = "txt";
                    break;
            }

            return (fileBytes, extension);
        }

        /// <summary>
        /// Get the content type for a document format
        /// </summary>
        private string GetContentType(DocumentFormat format)
        {
            return format switch
            {
                DocumentFormat.PDF => "application/pdf",
                DocumentFormat.DOCX => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                DocumentFormat.HTML => "text/html",
                DocumentFormat.Markdown => "text/markdown",
                DocumentFormat.TXT => "text/plain",
                _ => "application/octet-stream",
            };
        }

        /// <summary>
        /// Get the file extension for a document format
        /// </summary>
        private string GetFileExtension(DocumentFormat format)
        {
            return format switch
            {
                DocumentFormat.PDF => "pdf",
                DocumentFormat.DOCX => "docx",
                DocumentFormat.HTML => "html",
                DocumentFormat.Markdown => "md",
                DocumentFormat.TXT => "txt",
                _ => "bin",
            };
        }
    }
}