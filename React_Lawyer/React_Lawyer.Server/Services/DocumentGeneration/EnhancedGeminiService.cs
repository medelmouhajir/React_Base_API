using React_Lawyer.Server.Data;
using React_Lawyer.Server.Models.DocumentGeneration;
using System.Net.Http;

namespace React_Lawyer.Server.Services.DocumentGeneration
{
    public class EnhancedGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<EnhancedGeminiService> _logger;

        public EnhancedGeminiService(HttpClient httpClient, IConfiguration configuration, ApplicationDbContext context, ILogger<EnhancedGeminiService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _context = context;
            _logger = logger;

            // Configure the HttpClient with the base address from configuration
            string documentGeneratorUrl = _configuration["DocumentGenerator:BaseUrl"];
            if (!string.IsNullOrEmpty(documentGeneratorUrl))
            {
                _httpClient.BaseAddress = new Uri(documentGeneratorUrl);
            }
        }

        public async Task<IEnumerable<object>> CheckSpellingAndSyntaxAsync(string content , string language)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/SmartEditor/check-spelling-syntax", new { content , language });

                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<IEnumerable<object>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }


        public async Task<IEnumerable<object>> SuggestElegantPhrasingAsync(string content , string language)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/SmartEditor/suggest-phrasing", new { content, language });

                response.EnsureSuccessStatusCode();

                return await response.Content.ReadFromJsonAsync<IEnumerable<object>>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }

        public async Task<string> TranslateDocumentAsync(string content , string language)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/SmartEditor/document-translation", new { Content = content, Language = language });
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }

        public async Task<string> SummarizeDocumentAsync(string content , int maxLength)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/SmartEditor/document-summarize", new { content, Lenght = maxLength });
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }
        public async Task<string> SuggestEntityInfoIntegrationAsync(string content , object clientData , object caseData)
        {
            try
            {
                var response = await _httpClient.PostAsJsonAsync("api/SmartEditor/suggest-entity-integration", new { content, clientData , caseData });
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }


        public async Task<string> GenerateCompletionAsync(string prompt)
        {
            try
            {
                var response = await _httpClient.GetAsync("api/SmartEditor/document-completion");
                response.EnsureSuccessStatusCode();

                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching document templates");
                throw new Exception("Failed to fetch document templates", ex);
            }
        }
    }
}
