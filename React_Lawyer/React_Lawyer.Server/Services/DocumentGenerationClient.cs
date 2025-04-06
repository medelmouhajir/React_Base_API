namespace React_Lawyer.Server.Services
{
    public class DocumentGenerationClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<DocumentGenerationClient> _logger;
        private readonly string _baseUrl;

        public DocumentGenerationClient(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<DocumentGenerationClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;

            // Get base URL from configuration
            _baseUrl = configuration["Services:DocumentGenerator:Url"] ?? "http://localhost:5268";

            // Configure the HTTP client
            _httpClient.BaseAddress = new Uri(_baseUrl);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        /// <summary>
        /// Generate a document synchronously
        /// </summary>
        public async Task<GenerationResponse> GenerateDocumentAsync(GenerationRequest request)
        {
            try
            {
                _logger.LogInformation("Sending document generation request to DocumentGenerator service");

                var response = await _httpClient.PostAsJsonAsync("/api/documents/generate", request);
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<GenerationResponse>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling DocumentGenerator service");
                throw;
            }
        }

        /// <summary>
        /// Generate a document asynchronously
        /// </summary>
        public async Task<string> GenerateDocumentAsyncWithCallback(
            GenerationRequest request,
            string callbackUrl)
        {
            try
            {
                // Add callback URL to request
                request.CallbackUrl = callbackUrl;

                var response = await _httpClient.PostAsJsonAsync("/api/documents/generate/async", request);
                response.EnsureSuccessStatusCode();

                var result = await response.Content.ReadFromJsonAsync<JobResponse>();
                return result.JobId;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling DocumentGenerator service for async generation");
                throw;
            }
        }

        /// <summary>
        /// Get job status
        /// </summary>
        public async Task<GenerationResponse> GetJobStatusAsync(string jobId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/documents/status/{jobId}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<GenerationResponse>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking job status: {JobId}", jobId);
                throw;
            }
        }

        /// <summary>
        /// Get all templates
        /// </summary>
        public async Task<List<Template>> GetTemplatesAsync(string category = null)
        {
            try
            {
                var url = "/api/templates";
                if (!string.IsNullOrEmpty(category))
                {
                    url += $"?category={Uri.EscapeDataString(category)}";
                }

                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<List<Template>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting templates");
                throw;
            }
        }

        /// <summary>
        /// Get a template by ID
        /// </summary>
        public async Task<Template> GetTemplateAsync(string templateId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/templates/{templateId}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<Template>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting template: {TemplateId}", templateId);
                throw;
            }
        }

        /// <summary>
        /// Get document details
        /// </summary>
        public async Task<Document> GetDocumentAsync(string documentId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/documents/{documentId}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<Document>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting document: {DocumentId}", documentId);
                throw;
            }
        }

        /// <summary>
        /// Get documents by client
        /// </summary>
        public async Task<List<Document>> GetDocumentsByClientAsync(int clientId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/documents/client/{clientId}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<List<Document>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documents for client: {ClientId}", clientId);
                throw;
            }
        }

        /// <summary>
        /// Get documents by case
        /// </summary>
        public async Task<List<Document>> GetDocumentsByCaseAsync(int caseId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/documents/case/{caseId}");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<List<Document>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting documents for case: {CaseId}", caseId);
                throw;
            }
        }
    }

    /// <summary>
    /// Response for async job creation
    /// </summary>
    public class JobResponse
    {
        public string JobId { get; set; }
        public string StatusUrl { get; set; }
    }

    /// <summary>
    /// Document generation request model
    /// </summary>
    public class GenerationRequest
    {
        public string TemplateId { get; set; }
        public int ClientId { get; set; }
        public int? CaseId { get; set; }
        public Dictionary<string, object> ClientData { get; set; }
        public string Format { get; set; } = "PDF";
        public bool IncludeMetadata { get; set; } = true;
        public string UserId { get; set; }
        public string DocumentTitle { get; set; }
        public string Priority { get; set; } = "Normal";
        public int? LawFirmId { get; set; }
        public string CallbackUrl { get; set; }
        public GenerationOptions Options { get; set; } = new GenerationOptions();
    }

    /// <summary>
    /// Document generation options
    /// </summary>
    public class GenerationOptions
    {
        public float Temperature { get; set; } = 0.2f;
        public bool StoreHistory { get; set; } = true;
        public bool ValidateData { get; set; } = true;
        public bool AddFooter { get; set; } = true;
        public bool ApplyBranding { get; set; } = true;
        public string Language { get; set; } = "en";
        public string Jurisdiction { get; set; }
    }

    /// <summary>
    /// Document generation response model
    /// </summary>
    public class GenerationResponse
    {
        public string DocumentId { get; set; }
        public string Url { get; set; }
        public string Format { get; set; }
        public string Status { get; set; }
        public DateTime GeneratedAt { get; set; }
        public long Size { get; set; }
        public string DocumentTitle { get; set; }
        public string TemplateId { get; set; }
        public string TemplateName { get; set; }
        public string Error { get; set; }
        public string ContentHash { get; set; }
        public string JobId { get; set; }
    }

    /// <summary>
    /// Template model
    /// </summary>
    public class Template
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string Category { get; set; }
        public string Content { get; set; }
        public List<TemplateVariable> Variables { get; set; }
        public int Version { get; set; }
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string Language { get; set; }
        public string Jurisdiction { get; set; }
    }

    /// <summary>
    /// Template variable model
    /// </summary>
    public class TemplateVariable
    {
        public string Name { get; set; }
        public string DisplayName { get; set; }
        public string Description { get; set; }
        public string Type { get; set; }
        public bool IsRequired { get; set; }
        public string DefaultValue { get; set; }
        public string ValidationRule { get; set; }
        public string[] SampleValues { get; set; }
        public int Order { get; set; }
        public string Group { get; set; }
    }

    /// <summary>
    /// Document model
    /// </summary>
    public class Document
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string TemplateId { get; set; }
        public string TemplateName { get; set; }
        public int ClientId { get; set; }
        public int? CaseId { get; set; }
        public int? LawFirmId { get; set; }
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; }
        public string Format { get; set; }
        public long Size { get; set; }
        public string Url { get; set; }
        public int TemplateVersion { get; set; }
        public Dictionary<string, string> Metadata { get; set; }
        public bool IsFinalized { get; set; }
        public string Status { get; set; }
        public bool IsSharedWithClient { get; set; }
        public DateTime? SharedAt { get; set; }
        public List<string> Tags { get; set; }
    }
}
