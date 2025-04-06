using React_Lawyer.DocumentGenerator.Models.Templates.Gemini;
using React_Lawyer.DocumentGenerator.Models.Templates;
using React_Lawyer.DocumentGenerator.Models;
using System.Text.Json;

namespace React_Lawyer.DocumentGenerator.Services
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
        /// Generate a document based on a template and context variables
        /// </summary>
        /// <param name="template">The document template</param>
        /// <param name="context">Document context with variables</param>
        /// <returns>Generated document content</returns>
        public async Task<string> GenerateDocumentAsync(Template template, DocumentContext context)
        {
            _logger.LogInformation("Generating document for template: {TemplateName} ({TemplateId})",
                template.Name, template.Id);

            try
            {
                // Build the prompt
                var prompt = BuildDocumentPrompt(template, context);

                // Call the Gemini API
                var generatedContent = await GenerateContentAsync(prompt, context.GenerationDate);

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
        /// <param name="prompt">The prompt to send to Gemini</param>
        /// <param name="generationDate">The date of generation (for timestamp references)</param>
        /// <returns>Generated content</returns>
        private async Task<string> GenerateContentAsync(string prompt, DateTime generationDate)
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
        /// <param name="template">The document template</param>
        /// <param name="context">Document generation context</param>
        /// <returns>Formatted prompt for Gemini</returns>
        private string BuildDocumentPrompt(Template template, DocumentContext context)
        {
            var client = context.Client;
            var firm = context.Firm;
            var user = context.User;
            var caseInfo = context.Case;

            // Start with base instructions
            var prompt = new System.Text.StringBuilder();
            prompt.AppendLine("You are a legal document generator expert who creates professional, accurate legal documents based on templates.");
            prompt.AppendLine("Generate a complete legal document by filling in the template below with the provided client information and context.");
            prompt.AppendLine();

            // Add template-specific instructions if available
            if (!string.IsNullOrEmpty(template.GenerationInstructions))
            {
                prompt.AppendLine("# Template-Specific Instructions");
                prompt.AppendLine(template.GenerationInstructions);
                prompt.AppendLine();
            }

            // Explain the template format
            prompt.AppendLine("# Template Format");
            prompt.AppendLine("The template contains placeholder variables in the format {{VariableName}}.");
            prompt.AppendLine("Replace each placeholder with the appropriate information from the context provided.");
            prompt.AppendLine("Preserve all legal language, formatting, sections, and structure exactly as in the template.");
            prompt.AppendLine("Do not add, remove, or modify any sections that are not explicitly indicated by placeholder variables.");
            prompt.AppendLine();

            // Add context information
            prompt.AppendLine("# Client Information");
            prompt.AppendLine($"Client Name: {client.FullName}");
            prompt.AppendLine($"Client Type: {(client.IsCompany ? "Company" : "Individual")}");
            if (client.IsCompany) prompt.AppendLine($"Company Name: {client.CompanyName}");
            prompt.AppendLine($"Address: {client.Address?.FormattedAddress ?? "N/A"}");
            prompt.AppendLine($"Email: {client.Email}");
            prompt.AppendLine($"Phone: {client.Phone}");
            if (!string.IsNullOrEmpty(client.TaxId)) prompt.AppendLine($"Tax ID: {client.TaxId}");
            prompt.AppendLine();

            // Add case information if applicable
            if (caseInfo != null)
            {
                prompt.AppendLine("# Case Information");
                prompt.AppendLine($"Case Number: {caseInfo.CaseNumber}");
                prompt.AppendLine($"Case Title: {caseInfo.Title}");
                prompt.AppendLine($"Case Type: {caseInfo.Type}");
                prompt.AppendLine($"Court Name: {caseInfo.CourtName ?? "N/A"}");
                prompt.AppendLine($"Court Case Number: {caseInfo.CourtCaseNumber ?? "N/A"}");
                prompt.AppendLine($"Filing Date: {caseInfo.FilingDate?.ToString("d") ?? "N/A"}");
                prompt.AppendLine($"Opposing Party: {caseInfo.OpposingParty ?? "N/A"}");
                prompt.AppendLine($"Opposing Counsel: {caseInfo.OpposingCounsel ?? "N/A"}");
                prompt.AppendLine();
            }

            // Add law firm information
            if (firm != null)
            {
                prompt.AppendLine("# Law Firm Information");
                prompt.AppendLine($"Firm Name: {firm.Name}");
                prompt.AppendLine($"Firm Address: {firm.Address?.FormattedAddress ?? "N/A"}");
                prompt.AppendLine($"Firm Phone: {firm.Phone}");
                prompt.AppendLine($"Firm Email: {firm.Email}");
                prompt.AppendLine($"Firm Website: {firm.Website}");
                prompt.AppendLine();
            }

            // Add lawyer/user information
            if (user != null)
            {
                prompt.AppendLine("# Lawyer Information");
                prompt.AppendLine($"Name: {user.FullName}");
                prompt.AppendLine($"Title: {user.Title ?? "Attorney"}");
                prompt.AppendLine($"Email: {user.Email}");
                if (!string.IsNullOrEmpty(user.BarNumber)) prompt.AppendLine($"Bar Number: {user.BarNumber}");
                prompt.AppendLine();
            }

            // Add custom variables
            if (context.Variables.Count > 0)
            {
                prompt.AppendLine("# Custom Variables");
                foreach (var variable in context.Variables)
                {
                    prompt.AppendLine($"{variable.Key}: {variable.Value}");
                }
                prompt.AppendLine();
            }

            // Add current date information
            prompt.AppendLine("# Date Information");
            prompt.AppendLine($"Current Date: {context.GenerationDate:MMMM d, yyyy}");
            prompt.AppendLine();

            // Add document generation details
            prompt.AppendLine("# Document Generation Details");
            prompt.AppendLine($"Template Name: {template.Name}");
            prompt.AppendLine($"Template Category: {template.Category}");
            prompt.AppendLine($"Document Format: {context.Format}");
            prompt.AppendLine($"Jurisdiction: {context.Jurisdiction ?? template.Jurisdiction ?? "N/A"}");
            prompt.AppendLine($"Language: {context.Language ?? template.Language ?? "English"}");
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

        /// <summary>
        /// Create a training set based on sample data
        /// </summary>
        /// <param name="trainingData">The training data</param>
        /// <returns>Status indicator of training request</returns>
        public async Task<bool> FineTuneModelAsync(TrainingData trainingData)
        {
            // Note: This is a simplified implementation that assumes Gemini has some fine-tuning capabilities
            // The actual implementation would depend on Google's API for fine-tuning which may differ
            _logger.LogInformation("Fine-tuning model for training data: {TrainingDataName} ({TrainingDataId})",
                trainingData.Name, trainingData.Id);

            // Currently, Gemini doesn't support fine-tuning in the same way as some other models
            // But we can simulate the concept for this example
            await Task.Delay(100); // Just a placeholder for real API call

            return true;
        }
    }
}
