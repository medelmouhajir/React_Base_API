// React_Lawyer.Server/Services/DocumentGeneration/DocumentGenerationService.cs
using Microsoft.Extensions.Configuration;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Shared_Models.Cases;
using Shared_Models.Clients;
using React_Lawyer.Server.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.IO;
using System.Xml.Linq;
using React_Lawyer.Server.Models.DocumentGeneration;

namespace React_Lawyer.Server.Services.DocumentGeneration
{
    public class DocumentGenerationService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<DocumentGenerationService> _logger;

        public DocumentGenerationService(
            HttpClient httpClient,
            IConfiguration configuration,
            ApplicationDbContext context,
            ILogger<DocumentGenerationService> _logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
            this._logger = _logger;

            // Configure the HttpClient with the base address from configuration
            string documentGeneratorUrl = _configuration["DocumentGenerator:BaseUrl"];
            if (!string.IsNullOrEmpty(documentGeneratorUrl))
            {
                _httpClient.BaseAddress = new Uri(documentGeneratorUrl);
            }
        }

        /// <summary>
        /// Get all available document templates
        /// </summary>
        public async Task<IEnumerable<DocumentTemplate>> GetTemplatesAsync()
        {
            try
            {
                var response = await _httpClient.GetAsync("api/templates");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<IEnumerable<DocumentTemplate>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }

        /// <summary>
        /// Get templates by category
        /// </summary>
        public async Task<IEnumerable<DocumentTemplate>> GetTemplatesByCategoryAsync(string category)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/templates?category={category}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<IEnumerable<DocumentTemplate>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates for category: {Category}", category);
                throw new Exception($"Failed to fetch document templates for category: {category}", ex);
            }
        }

        /// <summary>
        /// Generate a document based on a template and data
        /// </summary>
        public async Task<DocumentGenerationResponse> GenerateDocumentAsync(DocumentGenerationRequest request)
        {
            try
            {
                _logger.LogInformation("Generating document using template {TemplateId}", request.TemplateId);

                // Create the request to the document generator service
                var generationRequest = new
                {
                    TemplateId = request.TemplateId,
                    Data = request.Data,
                    Format = request.Format,
                    DocumentTitle = request.DocumentTitle,
                    UserId = request.UserId.ToString()
                };

                var response = await _httpClient.PostAsJsonAsync("api/documents/generate", generationRequest);

                if (!response.IsSuccessStatusCode)
                {
                    string errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Document generation failed: {StatusCode} - {Error}",
                        response.StatusCode, errorContent);

                    throw new Exception($"Document generation failed: {response.StatusCode} - {errorContent}");
                }

                var result = await response.Content.ReadFromJsonAsync<DocumentGenerationResponse>();

                // Record the document in our database if needed
                if (result != null && !string.IsNullOrEmpty(result.DocumentId) && request.SaveToCase)
                {
                    await SaveDocumentReferenceAsync(result, request);
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document with template {TemplateId}", request.TemplateId);
                throw new Exception("Failed to generate document", ex);
            }
        }

        /// <summary>
        /// Download a generated document
        /// </summary>
        public async Task<(byte[] Content, string ContentType, string FileName)> DownloadDocumentAsync(string documentId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"api/documents/{documentId}/download");
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsByteArrayAsync();
                var contentType = response.Content.Headers.ContentType?.ToString() ?? "application/octet-stream";

                // Try to get filename from content-disposition header
                var contentDisposition = response.Content.Headers.ContentDisposition;
                string fileName = contentDisposition?.FileName ?? $"document-{documentId}.pdf";

                return (content, contentType, fileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading document {DocumentId}", documentId);
                throw new Exception($"Failed to download document {documentId}", ex);
            }
        }

        /// <summary>
        /// Save a reference to the generated document in our database
        /// </summary>
        private async Task SaveDocumentReferenceAsync(DocumentGenerationResponse generatedDocument, DocumentGenerationRequest request)
        {
            try
            {
                // Create a document record in our system
                var document = new Document
                {
                    Title = generatedDocument.Title,
                    FileType = GetFileTypeFromFormat(request.Format),
                    Description = $"{generatedDocument.Title}.{GetFileExtension(request.Format)}",
                    FilePath = generatedDocument.Url,
                    CaseId = request.CaseId == null ? 0 : request.CaseId.Value,
                    UploadDate = DateTime.UtcNow,
                    UploadedById = request.UserId,
                    IsSharedWithClient = false, // Default to not shared
                    FileSize = generatedDocument.Size,
                    Category = DocumentCategory.Other,
                    IsConfidential = false,
                    IsTemplate = false,
                    LawFirmId = request.LawFirmId,
                    VersionNumber = 1,
                };

                _context.Documents.Add(document);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Saved document reference for generated document {DocumentId}, linked to case {CaseId}",
                    generatedDocument.DocumentId, request.CaseId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving document reference for generated document {DocumentId}", generatedDocument.DocumentId);
                // We don't throw here to avoid failing the generation process
                // The document was generated, we just couldn't save the reference
            }
        }

        /// <summary>
        /// Get document data for a case
        /// </summary>
        public async Task<object> GetCaseDocumentDataAsync(int caseId)
        {
            try
            {
                // Get case with related data
                var caseData = await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                    .Include(c => c.Case_Clients)
                        .ThenInclude(cc => cc.Client)
                    .FirstOrDefaultAsync(c => c.CaseId == caseId);

                if (caseData == null)
                {
                    throw new KeyNotFoundException($"Case with ID {caseId} not found");
                }

                // Get the primary client (first client or null)
                var primaryClient = caseData.Case_Clients
                    .FirstOrDefault()?.Client;

                // Get law firm info
                var lawFirm = await _context.LawFirms
                    .FirstOrDefaultAsync(f => f.LawFirmId == caseData.LawFirmId);

                // Build a data object with all necessary information for document generation
                var documentData = new
                {
                    Case = new
                    {
                        caseData.CaseId,
                        caseData.CaseNumber,
                        caseData.Title,
                        caseData.Description,
                        Type = caseData.Type.ToString(),
                        Status = caseData.Status.ToString(),
                        OpenDate = caseData.OpenDate.ToString("yyyy-MM-dd"),
                        CloseDate = caseData.CloseDate?.ToString("yyyy-MM-dd"),
                        caseData.CourtName,
                        caseData.CourtCaseNumber,
                        caseData.OpposingParty,
                        caseData.OpposingCounsel,
                        NextHearingDate = caseData.NextHearingDate?.ToString("yyyy-MM-dd"),
                        caseData.Notes,
                        caseData.IsUrgent
                    },
                    Attorney = caseData.AssignedLawyer != null ? new
                    {
                        LawyerId = caseData.AssignedLawyer.LawyerId,
                        FirstName = caseData.AssignedLawyer.User?.FirstName,
                        LastName = caseData.AssignedLawyer.User?.LastName,
                        Email = caseData.AssignedLawyer.User?.Email,
                        Phone = caseData.AssignedLawyer.User?.PhoneNumber
                    } : null,
                    Client = primaryClient != null ? new
                    {
                        primaryClient.ClientId,
                        primaryClient.FirstName,
                        primaryClient.LastName,
                        primaryClient.Email,
                        primaryClient.PhoneNumber,
                        primaryClient.Address,
                        Type = primaryClient.Type.ToString(),
                        primaryClient.CompanyName,
                        primaryClient.TaxId
                    } : null,
                    LawFirm = lawFirm != null ? new
                    {
                        lawFirm.LawFirmId,
                        lawFirm.Name,
                        lawFirm.Address,
                        lawFirm.PhoneNumber,
                        lawFirm.Email,
                        lawFirm.Website
                    } : null,
                    CurrentDate = DateTime.Now.ToString("yyyy-MM-dd")
                };

                return documentData;
            }
            catch (Exception ex) when (!(ex is KeyNotFoundException))
            {
                _logger.LogError(ex, "Error preparing document data for case {CaseId}", caseId);
                throw new Exception($"Failed to prepare document data for case {caseId}", ex);
            }
        }

        /// <summary>
        /// Get document data for a client
        /// </summary>
        public async Task<object> GetClientDocumentDataAsync(int clientId)
        {
            try
            {
                // Get client data
                var client = await _context.Clients
                    .FirstOrDefaultAsync(c => c.ClientId == clientId);

                if (client == null)
                {
                    throw new KeyNotFoundException($"Client with ID {clientId} not found");
                }

                // Get law firm info (using the first case if available)
                var clientCase = await _context.Set<Case_Client>()
                    .Include(cc => cc.Case)
                    .Where(cc => cc.ClientId == clientId)
                    .FirstOrDefaultAsync();

                var lawFirmId = clientCase?.Case?.LawFirmId;
                var lawFirm = lawFirmId.HasValue
                    ? await _context.LawFirms.FirstOrDefaultAsync(f => f.LawFirmId == lawFirmId.Value)
                    : null;

                // Build a data object with all necessary information for document generation
                var documentData = new
                {
                    Client = new
                    {
                        client.ClientId,
                        client.FirstName,
                        client.LastName,
                        client.Email,
                        client.PhoneNumber,
                        client.Address,
                        Type = client.Type.ToString(),
                        client.CompanyName,
                        client.TaxId,
                        client.IdNumber,
                        client.Notes,
                        FullName = $"{client.FirstName} {client.LastName}"
                    },
                    LawFirm = lawFirm != null ? new
                    {
                        lawFirm.LawFirmId,
                        lawFirm.Name,
                        lawFirm.Address,
                        lawFirm.PhoneNumber,
                        lawFirm.Email,
                        lawFirm.Website
                    } : null,
                    CurrentDate = DateTime.Now.ToString("yyyy-MM-dd")
                };

                return documentData;
            }
            catch (Exception ex) when (!(ex is KeyNotFoundException))
            {
                _logger.LogError(ex, "Error preparing document data for client {ClientId}", clientId);
                throw new Exception($"Failed to prepare document data for client {clientId}", ex);
            }
        }

        #region Helper Methods

        private string GetFileTypeFromFormat(string format)
        {
            return format.ToLower() switch
            {
                "pdf" => "application/pdf",
                "docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "html" => "text/html",
                "markdown" => "text/markdown",
                "txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        private string GetFileExtension(string format)
        {
            return format.ToLower() switch
            {
                "pdf" => "pdf",
                "docx" => "docx",
                "html" => "html",
                "markdown" => "md",
                "txt" => "txt",
                _ => "bin"
            };
        }

        #endregion
    }
}