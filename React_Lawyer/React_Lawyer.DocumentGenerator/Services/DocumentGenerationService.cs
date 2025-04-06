using React_Lawyer.DocumentGenerator.Data;
using React_Lawyer.DocumentGenerator.Models;
using React_Lawyer.DocumentGenerator.Models.Templates.Gemini;

namespace React_Lawyer.DocumentGenerator.Services
{

    public class DocumentGenerationService
    {
        private readonly GeminiService _geminiService;
        private readonly TemplateService _templateService;
        private readonly StorageService _storageService;
        private readonly ClientService _clientService;
        private readonly IDocumentRepository _documentRepository;
        private readonly IGenerationJobRepository _jobRepository;
        private readonly ILogger<DocumentGenerationService> _logger;

        public DocumentGenerationService(
            GeminiService geminiService,
            TemplateService templateService,
            StorageService storageService,
            ClientService clientService,
            IDocumentRepository documentRepository,
            IGenerationJobRepository jobRepository,
            ILogger<DocumentGenerationService> logger)
        {
            _geminiService = geminiService;
            _templateService = templateService;
            _storageService = storageService;
            _clientService = clientService;
            _documentRepository = documentRepository;
            _jobRepository = jobRepository;
            _logger = logger;
        }

        /// <summary>
        /// Generate a document based on a request
        /// </summary>
        public async Task<GenerationResponse> GenerateDocumentAsync(GenerationRequest request)
        {
            _logger.LogInformation("Starting document generation for template: {TemplateId}", request.TemplateId);

            try
            {
                // Get the template
                var template = await _templateService.GetTemplateAsync(request.TemplateId);

                // Set document title if not specified
                if (string.IsNullOrEmpty(request.DocumentTitle))
                {
                    request.DocumentTitle = $"{template.Name} - {DateTime.UtcNow:yyyy-MM-dd}";
                }

                // Validate request data against template variables
                if (request.Options.ValidateData)
                {
                    ValidateRequestData(request, template);
                }

                // Create document context
                var context = await CreateDocumentContextAsync(request, template);

                // Generate document content
                var content = await _geminiService.GenerateDocumentAsync(template, context);

                // Add footer if specified
                if (request.Options.AddFooter)
                {
                    content = AddDocumentFooter(content, template, context);
                }

                // Convert to requested format
                var documentBytes = await ConvertToFormat(content, request.Format, request.Options, template);

                // Store the generated document
                var storedDocument = await StoreGeneratedDocumentAsync(documentBytes, request, template, content);

                _logger.LogInformation("Document generation completed successfully. Document ID: {DocumentId}",
                    storedDocument.Id);

                // Create and return response
                return new GenerationResponse
                {
                    DocumentId = storedDocument.Id,
                    Url = storedDocument.Url,
                    Format = request.Format,
                    Status = GenerationStatus.Completed,
                    GeneratedAt = DateTime.UtcNow,
                    DocumentTitle = storedDocument.Title,
                    TemplateId = template.Id,
                    TemplateName = template.Name,
                    Size = documentBytes.Length,
                    ContentHash = storedDocument.ContentHash,
                    Stats = new GenerationStats
                    {
                        ProcessingTimeMs = (long)(DateTime.UtcNow - context.GenerationDate).TotalMilliseconds,
                        VariablesReplaced = context.Variables.Count,
                        // Token info would come from the actual API response
                        TokensProcessed = content.Length / 4, // Rough approximation
                        ModelVersion = "gemini-1.5-pro"
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document: {ErrorMessage}", ex.Message);

                return new GenerationResponse
                {
                    Status = GenerationStatus.Failed,
                    Error = ex.Message,
                    GeneratedAt = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// Create a generation job for asynchronous processing
        /// </summary>
        public async Task<string> CreateGenerationJobAsync(GenerationRequest request)
        {
            var job = new GenerationJob
            {
                Request = request,
                Status = GenerationStatus.Queued,
                CreatedAt = DateTime.UtcNow,
                Priority = request.Priority,
                CallbackUrl = request.CallbackUrl
            };

            await _jobRepository.SaveAsync(job);
            _logger.LogInformation("Created generation job: {JobId} for template: {TemplateId}",
                job.Id, request.TemplateId);

            return job.Id;
        }

        /// <summary>
        /// Check the status of a generation job
        /// </summary>
        public async Task<GenerationResponse> GetJobStatusAsync(string jobId)
        {
            var job = await _jobRepository.GetByIdAsync(jobId);
            if (job == null)
            {
                throw new KeyNotFoundException($"Generation job with ID {jobId} was not found");
            }

            var response = new GenerationResponse
            {
                JobId = job.Id,
                Status = job.Status,
                GeneratedAt = job.CompletedAt ?? DateTime.UtcNow,
                Error = job.Error
            };

            if (job.Status == GenerationStatus.Completed && !string.IsNullOrEmpty(job.DocumentId))
            {
                var document = await _documentRepository.GetByIdAsync(job.DocumentId);
                if (document != null)
                {
                    response.DocumentId = document.Id;
                    response.Url = document.Url;
                    response.Format = document.Format;
                    response.DocumentTitle = document.Title;
                    response.Size = document.Size;
                    response.ContentHash = document.ContentHash;
                }
            }

            return response;
        }

        /// <summary>
        /// Process a pending generation job
        /// </summary>
        public async Task ProcessGenerationJobAsync(string jobId)
        {
            var job = await _jobRepository.GetByIdAsync(jobId);
            if (job == null || job.Status != GenerationStatus.Queued)
            {
                _logger.LogWarning("Attempted to process non-existent or non-queued job: {JobId}", jobId);
                return;
            }

            await _jobRepository.UpdateStatusAsync(jobId, GenerationStatus.Processing);
            await _jobRepository.AddLogAsync(jobId, "Starting document generation");

            try
            {
                await _jobRepository.UpdateProgressAsync(jobId, 10);

                var response = await GenerateDocumentAsync(job.Request);

                if (response.Status == GenerationStatus.Completed)
                {
                    await _jobRepository.UpdateStatusAsync(jobId, GenerationStatus.Completed);
                    await _jobRepository.SetDocumentIdAsync(jobId, response.DocumentId);
                    await _jobRepository.UpdateProgressAsync(jobId, 100);
                    await _jobRepository.AddLogAsync(jobId, $"Document generated successfully: {response.DocumentId}");
                }
                else
                {
                    await _jobRepository.UpdateStatusAsync(jobId, GenerationStatus.Failed, response.Error);
                    await _jobRepository.AddLogAsync(jobId, $"Document generation failed: {response.Error}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing generation job: {JobId}", jobId);
                await _jobRepository.UpdateStatusAsync(jobId, GenerationStatus.Failed, ex.Message);
                await _jobRepository.AddLogAsync(jobId, $"Exception: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate the request data against template variables
        /// </summary>
        private void ValidateRequestData(GenerationRequest request, Template template)
        {
            var requiredVariables = template.Variables.Where(v => v.IsRequired).Select(v => v.Name).ToList();
            var missingVariables = new List<string>();

            foreach (var variable in requiredVariables)
            {
                if (!request.ClientData.ContainsKey(variable))
                {
                    missingVariables.Add(variable);
                }
            }

            if (missingVariables.Any())
            {
                throw new ArgumentException(
                    $"Missing required variables: {string.Join(", ", missingVariables)}");
            }
        }

        /// <summary>
        /// Create a document context from a generation request
        /// </summary>
        private async Task<DocumentContext> CreateDocumentContextAsync(GenerationRequest request, Template template)
        {
            var context = new DocumentContext
            {
                Template = template,
                Format = request.Format,
                GenerationDate = DateTime.UtcNow,
                Language = request.Options.Language,
                Jurisdiction = request.Options.Jurisdiction ?? template.Jurisdiction,
                Variables = request.ClientData
            };

            // Add client information
            context.Client = await _clientService.GetClientInfoAsync(request.ClientId);

            // Add case information if specified
            if (request.CaseId.HasValue)
            {
                context.Case = await _clientService.GetCaseInfoAsync(request.CaseId.Value);
            }

            // Add firm information if available
            if (request.LawFirmId.HasValue)
            {
                context.Firm = await _clientService.GetFirmInfoAsync(request.LawFirmId.Value);
            }

            // Add user information if available
            if (!string.IsNullOrEmpty(request.UserId))
            {
                context.User = await _clientService.GetUserInfoAsync(request.UserId);
            }

            return context;
        }

        /// <summary>
        /// Add a footer to the generated document
        /// </summary>
        private string AddDocumentFooter(string content, Template template, DocumentContext context)
        {
            var footer = $"\n\n---\nGenerated on {context.GenerationDate:yyyy-MM-dd} using template: {template.Name} (v{template.Version})";

            if (context.Firm != null)
            {
                footer += $" | {context.Firm.Name}";
            }

            return content + footer;
        }

        /// <summary>
        /// Convert generated text content to the requested format
        /// </summary>
        private async Task<byte[]> ConvertToFormat(string content, DocumentFormat format, GenerationOptions options, Template template)
        {
            _logger.LogInformation("Converting document to format: {Format}", format);

            await Task.Delay(10); // Just to make this awaitable for now

            switch (format)
            {
                case DocumentFormat.PDF:
                    // In a real implementation, this would use a PDF library
                    return System.Text.Encoding.UTF8.GetBytes(content);

                case DocumentFormat.DOCX:
                    // In a real implementation, this would use a DOCX library
                    return System.Text.Encoding.UTF8.GetBytes(content);

                case DocumentFormat.HTML:
                    return System.Text.Encoding.UTF8.GetBytes($"<html><body>{content.Replace("\n", "<br>")}</body></html>");

                case DocumentFormat.Markdown:
                    return System.Text.Encoding.UTF8.GetBytes(content);

                case DocumentFormat.RTF:
                    // In a real implementation, this would use an RTF library
                    return System.Text.Encoding.UTF8.GetBytes(content);

                case DocumentFormat.TXT:
                    return System.Text.Encoding.UTF8.GetBytes(content);

                default:
                    throw new ArgumentException($"Unsupported document format: {format}");
            }
        }

        /// <summary>
        /// Store the generated document
        /// </summary>
        private async Task<Document> StoreGeneratedDocumentAsync(
            byte[] documentBytes,
            GenerationRequest request,
            Template template,
            string textContent)
        {
            // Create the document entity
            var document = new Document
            {
                Title = request.DocumentTitle,
                TemplateId = template.Id,
                TemplateName = template.Name,
                ClientId = request.ClientId,
                CaseId = request.CaseId,
                LawFirmId = request.LawFirmId,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = request.UserId,
                Format = request.Format,
                Size = documentBytes.Length,
                TemplateVersion = template.Version,
                ClientDataSnapshot = System.Text.Json.JsonSerializer.Serialize(request.ClientData),
                Status = DocumentStatus.Draft
            };

            // Set content hash
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                document.ContentHash = Convert.ToBase64String(sha.ComputeHash(documentBytes));
            }

            // Store the document with the storage service
            var storagePath = await _storageService.StoreDocumentAsync(
                documentBytes,
                document.Id,
                request.Format.ToString().ToLowerInvariant());

            document.StoragePath = storagePath;
            document.Url = _storageService.GetDocumentUrl(storagePath);

            // Save to the repository
            await _documentRepository.SaveAsync(document);

            return document;
        }
    }
}
