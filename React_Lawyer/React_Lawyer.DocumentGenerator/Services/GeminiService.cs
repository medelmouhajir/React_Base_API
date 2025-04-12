using DocumentGeneratorAPI.Models;
using DocumentGeneratorAPI.Models.Gemini;
using React_Lawyer.DocumentGenerator.Models.Gemini;
using System.Text;
using System.Text.Json;

namespace DocumentGeneratorAPI.Services
{
    public class GeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiService> _logger;
        private readonly string _apiKey;
        private readonly string _apiBaseUrl;
        private readonly string _modelName;

        public GeminiService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;

            _apiKey = _configuration["Gemini:ApiKey"];
            _apiBaseUrl = _configuration["Gemini:ApiUrl"] ?? "https://generativelanguage.googleapis.com/v1beta";
            _modelName = _configuration["Gemini:ModelName"] ?? "models/gemini-2.5-pro-preview-03-25";

            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new InvalidOperationException("Gemini API key is not configured");
            }
        }

        /// <summary>
        /// Generate a document based on a template and variables
        /// </summary>
        public async Task<string> GenerateDocumentAsync(Template template, object data)
        {
            _logger.LogInformation("Generating document for template: {TemplateName} ({TemplateId})",
                template.Name, template.Id);

            try
            {
                // Build the prompt
                var prompt = BuildDocumentPrompt(template, data);

                // Call the Gemini API
                var generatedContent = await GenerateContentAsync(prompt);

                _logger.LogInformation("Document generation successful. Generated {Length} characters.",
                    generatedContent?.Length ?? 0);

                return generatedContent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating document for template: {TemplateId}", template.Id);
                throw;
            }
        }

        /// <summary>
        /// Call the Gemini API to generate content based on a prompt
        /// </summary>
        private async Task<string> GenerateContentAsync(string prompt)
        {
            var url = $"{_apiBaseUrl}/{_modelName}:generateContent?key={_apiKey}";

            var request = new GeminiRequest
            {
                Contents = new List<ContentPart>
                {
                    new ContentPart
                    {
                        Role = "user",
                        Parts = new List<Part>
                        {
                            new Part { Text = prompt }
                        }
                    }
                },
                GenerationConfig = new GenerationConfig
                {
                    Temperature = 0.2f, // Lower temperature for more predictable document generation
                    MaxOutputTokens = 8192, // Up to max tokens for potentially lengthy documents
                    TopK = 40,
                    TopP = 0.95f
                },
                SafetySettings = new List<SafetySetting>
                {
                    new SafetySetting
                    {
                        Category = "HARM_CATEGORY_HATE_SPEECH",
                        Threshold = "BLOCK_NONE"  // Legal documents may contain terms that could trigger filters
                    },
                    new SafetySetting
                    {
                        Category = "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        Threshold = "BLOCK_NONE"
                    },
                    new SafetySetting
                    {
                        Category = "HARM_CATEGORY_HARASSMENT",
                        Threshold = "BLOCK_NONE"
                    },
                    new SafetySetting
                    {
                        Category = "HARM_CATEGORY_DANGEROUS_CONTENT",
                        Threshold = "BLOCK_NONE"
                    }
                }
            };

            // Log the request (but mask the API key in logs)
            var requestJson = JsonSerializer.Serialize(request);
            _logger.LogDebug("Sending request to Gemini API. Size: {Size} bytes", requestJson.Length);

            try
            {
                var response = await _httpClient.PostAsJsonAsync(url, request);
                response.EnsureSuccessStatusCode();

                var geminiResponse = await response.Content.ReadFromJsonAsync<GeminiResponse>();

                if (geminiResponse?.Candidates == null || geminiResponse.Candidates.Count == 0)
                {
                    throw new InvalidOperationException("No response candidates returned from Gemini API");
                }

                var textContent = "";
                foreach (var part in geminiResponse.Candidates[0].Content.Parts)
                {
                    textContent += part.Text;
                }

                // Log token usage
                _logger.LogInformation("Gemini API usage: {PromptTokens} prompt tokens, {ResponseTokens} response tokens",
                    geminiResponse.UsageMetadata?.PromptTokenCount ?? 0,
                    geminiResponse.UsageMetadata?.CandidatesTokenCount ?? 0);

                return textContent;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error while calling Gemini API: {StatusCode}", ex.StatusCode);
                throw new Exception("Failed to communicate with the Gemini API. Please try again later.", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling Gemini API");
                throw new Exception("An error occurred while generating the document.", ex);
            }
        }


        private string BuildDocumentPrompt(Template template, object data)
        {
            var prompt = new StringBuilder();
            prompt.AppendLine("You are a highly precise legal document generation expert.");
            prompt.AppendLine("Your task is to generate a professional legal document based on the following guidelines:");
            prompt.AppendLine();

            // Serialize the data to identify available information
            var serializedData = JsonSerializer.Serialize(data, new JsonSerializerOptions { WriteIndented = true });
            var dataDict = JsonSerializer.Deserialize<Dictionary<string, object>>(serializedData);

            // Template information
            prompt.AppendLine("# Template Reference");
            prompt.AppendLine($"Template Name: {template.Name}");
            prompt.AppendLine($"Template Category: {template.Category}");
            prompt.AppendLine($"Jurisdiction: {template.Jurisdiction ?? "N/A"}");
            prompt.AppendLine();

            // Original template content
            prompt.AppendLine("# Original Template Content");
            prompt.AppendLine(template.Content);
            prompt.AppendLine();

            // Available client data
            prompt.AppendLine("# Available Client Data");
            var availableData = new Dictionary<string, object>();
            foreach (var entry in dataDict)
            {
                // Only include non-null values
                if (entry.Value != null)
                {
                    availableData[entry.Key] = entry.Value;
                }
            }
            prompt.AppendLine(JsonSerializer.Serialize(availableData, new JsonSerializerOptions { WriteIndented = true }));
            prompt.AppendLine();

            // Specific generation instructions
            prompt.AppendLine("# Generation Instructions");
            prompt.AppendLine("1. Use the original template as a structural guide.");
            prompt.AppendLine("2. Generate a new document based on the available data.");
            prompt.AppendLine("3. IMPORTANT: Only include information that is explicitly present in the client data.");
            prompt.AppendLine("4. If a field from the template is not present in the data, do NOT include a placeholder or guess the information.");
            prompt.AppendLine("5. Maintain the professional legal tone and formatting of the original template.");
            prompt.AppendLine("6. Ensure all included information is accurate and matches the provided data exactly.");
            prompt.AppendLine("7. Return ONLY the generated document with no additional comments or explanations.");

            return prompt.ToString();
        }
    }
}