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
            _modelName = _configuration["Gemini:ModelName"] ?? "models/gemini-1.5-pro";

            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new InvalidOperationException("Gemini API key is not configured");
            }
        }

        /// <summary>
        /// Generate a document based on a template and variables
        /// </summary>
        public async Task<string> GenerateDocumentAsync(Template template, Dictionary<string, string> variables)
        {
            _logger.LogInformation("Generating document for template: {TemplateName} ({TemplateId})",
                template.Name, template.Id);

            try
            {
                // Build the prompt
                var prompt = BuildDocumentPrompt(template, variables);

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

        /// <summary>
        /// Build the prompt for document generation
        /// </summary>
        private string BuildDocumentPrompt(Template template, Dictionary<string, string> variables)
        {
            // Start with base instructions
            var prompt = new StringBuilder();
            prompt.AppendLine("You are a legal document generator expert who creates professional, accurate legal documents based on templates.");
            prompt.AppendLine("Generate a complete legal document by filling in the template below with the provided client information and context.");
            prompt.AppendLine();

            // Explain the template format
            prompt.AppendLine("# Template Format");
            prompt.AppendLine("The template contains placeholder variables in the format {{VariableName}}.");
            prompt.AppendLine("Replace each placeholder with the appropriate information from the context provided.");
            prompt.AppendLine("Preserve all legal language, formatting, sections, and structure exactly as in the template.");
            prompt.AppendLine("Do not add, remove, or modify any sections that are not explicitly indicated by placeholder variables.");
            prompt.AppendLine();

            // Add current date information
            prompt.AppendLine("# Date Information");
            prompt.AppendLine("Current Date: " + DateTime.UtcNow.ToString("MMMM d, yyyy"));
            prompt.AppendLine();

            // Add document generation details
            prompt.AppendLine("# Document Generation Details");
            prompt.AppendLine($"Template Name: {template.Name}");
            prompt.AppendLine($"Template Category: {template.Category}");
            prompt.AppendLine($"Jurisdiction: {template.Jurisdiction ?? "N/A"}");
            prompt.AppendLine($"Language: {template.Language ?? "English"}");
            prompt.AppendLine();

            // Add variables to be replaced
            prompt.AppendLine("# Variables to Replace");
            foreach (var variable in variables)
            {
                prompt.AppendLine($"{{{{{variable.Key}}}}} => {variable.Value}");
            }
            prompt.AppendLine();

            // Add the template content
            prompt.AppendLine("# Template");
            prompt.AppendLine(template.Content);
            prompt.AppendLine();

            // Add closing instructions
            prompt.AppendLine("# Response Format");
            prompt.AppendLine("Return ONLY the completed document with all placeholders replaced with the appropriate information.");
            prompt.AppendLine("Do not include any explanations, comments, or additional text outside the document itself.");
            prompt.AppendLine("Keep all paragraph breaks, indentation, and document structure intact.");

            return prompt.ToString();
        }
    }
}