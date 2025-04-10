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

                // We no longer need to validate variables since we're using Gemini more intelligently

                // Generate document content using Gemini
                string generatedContent = await _geminiService.GenerateDocumentAsync(template, request.Data);

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

            try
            {
                switch (format)
                {
                    case DocumentFormat.PDF:
                        using (var memoryStream = new MemoryStream())
                        {
                            using (var document = new iTextSharp.text.Document())
                            {
                                try
                                {
                                    var writer = iTextSharp.text.pdf.PdfWriter.GetInstance(document, memoryStream);
                                    document.Open();

                                    // Load embedded font resource
                                    var assembly = System.Reflection.Assembly.GetExecutingAssembly();
                                    string resourceName = assembly.GetManifestResourceNames()
                                        .FirstOrDefault(name => name.EndsWith("Amiri-Regular.ttf"));

                                    _logger.LogInformation($"Looking for font resource: {resourceName}");

                                    if (resourceName != null)
                                    {
                                        using (var fontStream = assembly.GetManifestResourceStream(resourceName))
                                        {
                                            byte[] fontData = new byte[fontStream.Length];
                                            fontStream.Read(fontData, 0, fontData.Length);

                                            // This is the part that needs fixing - make sure we use the correct encoding parameters
                                            var baseFont = iTextSharp.text.pdf.BaseFont.CreateFont(
                                                "Amiri-Regular.ttf",
                                                iTextSharp.text.pdf.BaseFont.IDENTITY_H, // Use IDENTITY_H for Unicode
                                                iTextSharp.text.pdf.BaseFont.EMBEDDED,
                                                false, fontData, null);

                                            var arabicFont = new iTextSharp.text.Font(baseFont, 12);

                                            // Register the encoding provider
                                            System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);

                                            // Create a table with RTL support
                                            var table = new iTextSharp.text.pdf.PdfPTable(1);
                                            table.WidthPercentage = 100;
                                            table.RunDirection = iTextSharp.text.pdf.PdfWriter.RUN_DIRECTION_RTL;

                                            // Split content into paragraphs
                                            var paragraphs = content.Split('\n');
                                            foreach (var paragraph in paragraphs)
                                            {
                                                if (string.IsNullOrWhiteSpace(paragraph))
                                                {
                                                    // Add empty cell for line breaks
                                                    var emptyCell = new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(" ", arabicFont));
                                                    emptyCell.Border = iTextSharp.text.Rectangle.NO_BORDER;
                                                    table.AddCell(emptyCell);
                                                    continue;
                                                }

                                                // Create a cell with RTL text
                                                var cell = new iTextSharp.text.pdf.PdfPCell(new iTextSharp.text.Phrase(paragraph, arabicFont));
                                                cell.HorizontalAlignment = iTextSharp.text.Element.ALIGN_RIGHT;
                                                cell.Border = iTextSharp.text.Rectangle.NO_BORDER;
                                                cell.PaddingBottom = 5f;

                                                // Add cell to table
                                                table.AddCell(cell);
                                            }

                                            // Add the table to the document
                                            document.Add(table);
                                        }
                                    }
                                    else
                                    {
                                        // Font resource not found, try a simple approach with UTF-8 encoding
                                        System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                                        document.Add(new iTextSharp.text.Paragraph(content));
                                    }

                                    // Ensure we have at least one page
                                    if (document.PageNumber == 0)
                                    {
                                        document.NewPage();
                                        document.Add(new iTextSharp.text.Paragraph(" "));
                                    }
                                }
                                catch (Exception ex)
                                {
                                    _logger.LogError(ex, "Error generating PDF document");
                                    // Ensure at least one page exists
                                    if (document.PageNumber == 0)
                                    {
                                        document.Add(new iTextSharp.text.Paragraph("Error: " + ex.Message));
                                    }
                                }

                                document.Close();
                            }
                            fileBytes = memoryStream.ToArray();
                        }
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
            catch (Exception e)
            {

                throw;
            }

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