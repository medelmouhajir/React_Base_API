using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Services.Models;
using System.Text.Json;

namespace React_Rentify.Server.Services
{
    public class GeminiIdentityReaderService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _apiBaseUrl;
        private readonly string _modelName;
        private readonly ILogger<GeminiIdentityReaderService> _logger;

        public GeminiIdentityReaderService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiIdentityReaderService> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _apiKey = configuration["Gemini:ApiKey"]
                ?? throw new InvalidOperationException("Gemini API key not set");
            _apiBaseUrl = configuration["Gemini:ApiUrl"]
                ?? "https://generativelanguage.googleapis.com/v1beta";
            _modelName = configuration["Gemini:IdentityModelName"]
                ?? "models/gemini-vision-identityextractor-1.0.0";
        }

        /// <summary>
        /// Extracts identity fields from 1–6 document images.
        /// </summary>
        public async Task<Customer> ExtractIdentityAsync(IEnumerable<string> base64Images)
        {
            var images = base64Images?.ToList()
                ?? throw new ArgumentNullException(nameof(base64Images));
            if (images.Count < 1 || images.Count > 6)
                throw new ArgumentException("You must supply between 1 and 6 images.");

            var url = $"{_apiBaseUrl}/{_modelName}:identityExtract?key={_apiKey}";
            var request = new IdentityExtractRequest
            {
                Images = images.Select(b64 => new ImagePart { Base64 = b64 }).ToList(),
                Prompt = @"
                        Extract the following fields from these identity document images:
                        FullName, NationalId, PassportId, LicenseNumber, DateOfBirth, Address.
                        Return ONLY valid JSON fitting the Customer schema."
            };

            _logger.LogInformation("Calling Gemini identityExtract with {Count} images", images.Count);
            var response = await _httpClient.PostAsJsonAsync(url, request);
            response.EnsureSuccessStatusCode();

            var geminiResp = await response.Content.ReadFromJsonAsync<IdentityExtractResponse>();
            if (geminiResp?.Candidates == null || geminiResp.Candidates.Count == 0)
                throw new InvalidOperationException("No candidates returned from Gemini.");

            // Concatenate text parts and parse JSON
            var json = string.Concat(geminiResp.Candidates[0]
                .Content.Parts.Select(p => p.Text));
            _logger.LogDebug("Gemini returned: {Json}", json);

            var customer = JsonSerializer.Deserialize<Customer>(
                json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            if (customer == null)
                throw new InvalidOperationException("Failed to deserialize Customer.");

            return customer;
        }
    }
}
