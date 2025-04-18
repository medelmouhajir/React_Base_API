using DocumentGeneratorAPI.Models.Gemini;
using React_Lawyer.DocumentGenerator.Models.Gemini;
using System.Text;
using System.Text.Json;

namespace DocumentGeneratorAPI.Services
{
    public class EnhancedGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<EnhancedGeminiService> _logger;
        private readonly string _apiKey;
        private readonly string _apiBaseUrl;
        private readonly string _modelName;

        public EnhancedGeminiService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<EnhancedGeminiService> logger)
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
        /// Check a document for spelling and syntax errors
        /// </summary>
        /// <param name="content">The document content to check</param>
        /// <param name="language">The language of the document</param>
        /// <returns>A list of suggestions for corrections</returns>
        public async Task<List<object>> CheckSpellingAndSyntaxAsync(string content, string language = "en")
        {
            _logger.LogInformation("Checking spelling and syntax for document in {Language}", language);

            var prompt = new StringBuilder();
            prompt.AppendLine("You are a precise legal proofreader with expertise in legal terminology and documentation and an expert in Arabic language. ");
            prompt.AppendLine("Please analyze the following legal document for spelling, grammar, and syntax errors.");
            prompt.AppendLine();
            prompt.AppendLine("# Document Content");
            prompt.AppendLine(content);
            prompt.AppendLine();
            prompt.AppendLine("# Instructions");
            prompt.AppendLine("1. Identify spelling errors, grammatical mistakes, and syntax issues in the document");
            prompt.AppendLine("2. For each issue found, provide:");
            prompt.AppendLine("   - The original text containing the error");
            prompt.AppendLine("   - The suggested correction");
            prompt.AppendLine("   - A brief explanation of the issue using the content's language");
            prompt.AppendLine("3. Categorize each suggestion as 'spelling', 'grammar', or 'syntax'");
            prompt.AppendLine("4. Format your response as a JSON array with the following structure for each suggestion:");
            prompt.AppendLine("   ```json");
            prompt.AppendLine("   {");
            prompt.AppendLine("     \"type\": \"spelling|grammar|syntax\",");
            prompt.AppendLine("     \"original\": \"text with error\",");
            prompt.AppendLine("     \"suggested\": \"corrected text\",");
            prompt.AppendLine("     \"explanation\": \"explanation of the issue\"");
            prompt.AppendLine("   }");
            prompt.AppendLine("   ```");
            prompt.AppendLine("5. If no issues are found, return an empty array.");
            prompt.AppendLine();
            prompt.AppendLine("Return ONLY the JSON array with no additional text or explanations.");

            var generatedResponse = await GenerateContentAsync(prompt.ToString());

            try
            {
                // Extract JSON content (it might be wrapped in ```json...``` blocks)
                var jsonContent = ExtractJsonContent(generatedResponse);
                var suggestions = JsonSerializer.Deserialize<List<object>>(jsonContent);
                return suggestions ?? new List<object>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing AI response for spelling and syntax check");
                return new List<object>();
            }
        }

        /// <summary>
        /// Suggest more elegant phrasing for the document
        /// </summary>
        /// <param name="content">The document content to enhance</param>
        /// <param name="language">The language of the document</param>
        /// <returns>A list of suggestions for elegant phrasing</returns>
        public async Task<List<object>> SuggestElegantPhrasingAsync(string content, string language = "en")
        {
            _logger.LogInformation("Generating elegant phrasing suggestions for document in {Language}", language);

            var prompt = new StringBuilder();
            prompt.AppendLine("You are an expert legal writing consultant specializing in elegant and precise language for legal documents and an expert in the Arabic language.");
            prompt.AppendLine("Please analyze the following legal document and suggest improvements to make the language more elegant, professional, and precise.");
            prompt.AppendLine();
            prompt.AppendLine("# Document Content");
            prompt.AppendLine(content);
            prompt.AppendLine();
            prompt.AppendLine("# Instructions");
            prompt.AppendLine("1. Identify 5-10 phrases or sentences that could be improved for elegance, clarity, or professionalism");
            prompt.AppendLine("2. Do not change the legal meaning or intent of any clause");
            prompt.AppendLine("3. For each suggestion, provide:");
            prompt.AppendLine("   - The original text");
            prompt.AppendLine("   - Your suggested improvement");
            prompt.AppendLine("   - A brief explanation of the issue using the content's language");
            prompt.AppendLine("4. Format your response as a JSON array with the following structure for each suggestion:");
            prompt.AppendLine("   ```json");
            prompt.AppendLine("   {");
            prompt.AppendLine("     \"type\": \"elegance\",");
            prompt.AppendLine("     \"original\": \"original text\",");
            prompt.AppendLine("     \"suggested\": \"improved text\",");
            prompt.AppendLine("     \"explanation\": \"explanation of the improvement\"");
            prompt.AppendLine("   }");
            prompt.AppendLine("   ```");
            prompt.AppendLine();
            prompt.AppendLine("Return ONLY the JSON array with no additional text or explanations.");

            var generatedResponse = await GenerateContentAsync(prompt.ToString());

            try
            {
                // Extract JSON content
                var jsonContent = ExtractJsonContent(generatedResponse);
                var suggestions = JsonSerializer.Deserialize<List<object>>(jsonContent);
                return suggestions ?? new List<object>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing AI response for elegant phrasing suggestions");
                return new List<object>();
            }
        }

        /// <summary>
        /// Translate document content to another language
        /// </summary>
        /// <param name="content">The document content to translate</param>
        /// <param name="targetLanguage">The target language code (e.g., "fr" for French)</param>
        /// <returns>The translated document content</returns>
        public async Task<string> TranslateDocumentAsync(string content, string targetLanguage)
        {
            _logger.LogInformation("Translating document to {Language}", targetLanguage);

            var languageName = GetLanguageName(targetLanguage);

            var prompt = new StringBuilder();
            prompt.AppendLine($"You are an expert legal translator with deep knowledge of legal terminology in both the source language and {languageName}.");
            prompt.AppendLine($"Please translate the following legal document into {languageName}, preserving all legal meaning and terminology accurately.");
            prompt.AppendLine();
            prompt.AppendLine("# Document Content");
            prompt.AppendLine(content);
            prompt.AppendLine();
            prompt.AppendLine("# Instructions");
            prompt.AppendLine("1. Translate the entire document into the target language");
            prompt.AppendLine("2. Maintain all formatting, paragraph breaks, and document structure");
            prompt.AppendLine("3. Use appropriate legal terminology in the target language");
            prompt.AppendLine("4. Do not add or remove any information from the original document");
            prompt.AppendLine("5. Return ONLY the translated text without any explanations or notes");

            return await GenerateContentAsync(prompt.ToString());
        }

        /// <summary>
        /// Summarize document content
        /// </summary>
        /// <param name="content">The document content to summarize</param>
        /// <param name="maxLength">Maximum length of the summary in words</param>
        /// <returns>The document summary</returns>
        public async Task<string> SummarizeDocumentAsync(string content, int maxLength = 300)
        {
            _logger.LogInformation("Summarizing document with max length {MaxLength} words", maxLength);

            var prompt = new StringBuilder();
            prompt.AppendLine("You are an expert legal analyst with the ability to distill complex legal documents into clear, concise summaries.");
            prompt.AppendLine("Please summarize the following legal document while preserving all key information and legal implications.");
            prompt.AppendLine();
            prompt.AppendLine("# Document Content");
            prompt.AppendLine(content);
            prompt.AppendLine();
            prompt.AppendLine("# Instructions");
            prompt.AppendLine($"1. Create a summary of no more than {maxLength} words");
            prompt.AppendLine("2. Include all key legal points, obligations, rights, and conditions");
            prompt.AppendLine("3. Organize the summary in a clear, structured format");
            prompt.AppendLine("4. Use plain language while maintaining legal accuracy");
            prompt.AppendLine("5. Return ONLY the summary without any explanations or notes");

            return await GenerateContentAsync(prompt.ToString());
        }

        /// <summary>
        /// Suggest client or case information to integrate into the document
        /// </summary>
        /// <param name="content">The document content</param>
        /// <param name="clientData">Client data in JSON format</param>
        /// <param name="caseData">Case data in JSON format</param>
        /// <returns>A list of suggestions for integrating client/case information</returns>

        public async Task<List<object>> SuggestEntityInfoIntegrationAsync(
    string content,
    object clientData = null,
    object caseData = null)
        {
            _logger.LogInformation("Generating suggestions for client/case information integration");

            var prompt = new StringBuilder();
            prompt.AppendLine("# Today date UTC : " + DateTime.UtcNow.ToString());
            prompt.AppendLine("You are a specialized legal assistant who helps fill in empty fields in legal documents using client and case information.");
            prompt.AppendLine("Please analyze the following legal document and identify all empty fields or placeholders that need to be filled.");
            prompt.AppendLine();
            prompt.AppendLine("# Document Content");
            prompt.AppendLine(content);
            prompt.AppendLine();

            if (clientData != null)
            {
                prompt.AppendLine("# Available Client Information");
                prompt.AppendLine(JsonSerializer.Serialize(clientData, new JsonSerializerOptions { WriteIndented = true }));
                prompt.AppendLine();
            }

            if (caseData != null)
            {
                prompt.AppendLine("# Available Case Information");
                prompt.AppendLine(JsonSerializer.Serialize(caseData, new JsonSerializerOptions { WriteIndented = true }));
                prompt.AppendLine();
            }

            prompt.AppendLine("# Instructions");
            prompt.AppendLine("1. Identify specific empty fields, placeholders, or generic terms in the document that should be filled with client or case information.");
            prompt.AppendLine("2. Look for patterns like [Client Name], ____, <name>, XXXX, or any blank spaces preceded by labels like 'Name:', 'Address:', etc.");
            prompt.AppendLine("3. Also identify generic references like 'the client', 'the buyer', 'the seller', 'the property owner', etc., that could be replaced with specific names.");
            prompt.AppendLine("4. For roles like 'buyer', 'seller', 'owner', etc., suggest appropriate client information if available.");
            prompt.AppendLine("5. Be precise - match the exact client/case field to the appropriate document placeholder.");
            prompt.AppendLine("6. For each suggestion, provide:");
            prompt.AppendLine("   - The exact original text to be replaced (including placeholders or generic terms)");
            prompt.AppendLine("   - The suggested text with properly formatted and integrated client or case information");
            prompt.AppendLine("   - A brief explanation of what information was added and why, using the document's original language");
            prompt.AppendLine("7. Format your response as a JSON array with the following structure for each suggestion:");
            prompt.AppendLine("   ```json");
            prompt.AppendLine("   {");
            prompt.AppendLine("     \"type\": \"info_integration\",");
            prompt.AppendLine("     \"original\": \"original text with placeholder or generic term\",");
            prompt.AppendLine("     \"suggested\": \"text with integrated specific information\",");
            prompt.AppendLine("     \"explanation\": \"explanation of what was integrated\"");
            prompt.AppendLine("   }");
            prompt.AppendLine("   ```");
            prompt.AppendLine();
            prompt.AppendLine("8. If the document appears to be in Arabic or another language, ensure your explanations are also in that language.");
            prompt.AppendLine("9. Only suggest replacements where you have the exact matching information - don't make assumptions about missing data.");
            prompt.AppendLine();
            prompt.AppendLine("Return ONLY the JSON array with no additional text or explanations.");

            var generatedResponse = await GenerateContentAsync(prompt.ToString());

            try
            {
                // Extract JSON content
                var jsonContent = ExtractJsonContent(generatedResponse);
                var suggestions = JsonSerializer.Deserialize<List<object>>(jsonContent);
                return suggestions ?? new List<object>();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error parsing AI response for client/case info integration suggestions");
                return new List<object>();
            }
        }

        /// <summary>
        /// Generate custom AI completion based on a prompt
        /// </summary>
        /// <param name="prompt">The user's prompt</param>
        /// <returns>The generated completion text</returns>
        public async Task<string> GenerateCompletionAsync(string prompt)
        {
            _logger.LogInformation("Generating AI completion for prompt: {PromptPreview}",
                prompt.Length > 50 ? prompt.Substring(0, 50) + "..." : prompt);

            var enhancedPrompt = new StringBuilder();
            enhancedPrompt.AppendLine("You are a specialized legal AI assistant helping a legal professional with a document.");
            enhancedPrompt.AppendLine("Please respond to the following request professionally, accurately, and concisely:");
            enhancedPrompt.AppendLine();
            enhancedPrompt.AppendLine(prompt);

            return await GenerateContentAsync(enhancedPrompt.ToString());
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
                    Temperature = 0.2f,
                    MaxOutputTokens = 8192,
                    TopK = 40,
                    TopP = 0.95f
                },
                SafetySettings = new List<SafetySetting>
                {
                    new SafetySetting
                    {
                        Category = "HARM_CATEGORY_HATE_SPEECH",
                        Threshold = "BLOCK_NONE"
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
                throw new Exception("An error occurred while generating content.", ex);
            }
        }

        /// <summary>
        /// Helper method to extract JSON content from an AI response that might include markdown code blocks
        /// </summary>
        private string ExtractJsonContent(string response)
        {
            // Check if response is wrapped in markdown code blocks
            if (response.Contains("```json"))
            {
                int startIndex = response.IndexOf("```json") + 7;
                int endIndex = response.IndexOf("```", startIndex);

                if (endIndex > startIndex)
                {
                    return response.Substring(startIndex, endIndex - startIndex).Trim();
                }
            }
            else if (response.Contains("```"))
            {
                int startIndex = response.IndexOf("```") + 3;
                int endIndex = response.IndexOf("```", startIndex);

                if (endIndex > startIndex)
                {
                    return response.Substring(startIndex, endIndex - startIndex).Trim();
                }
            }

            // If no code blocks found, assume the entire response is JSON
            return response.Trim();
        }

        /// <summary>
        /// Get language name from language code
        /// </summary>
        private string GetLanguageName(string languageCode)
        {
            return languageCode.ToLower() switch
            {
                "en" => "English",
                "fr" => "French",
                "es" => "Spanish",
                "de" => "German",
                "it" => "Italian",
                "pt" => "Portuguese",
                "ru" => "Russian",
                "zh" => "Chinese",
                "ja" => "Japanese",
                "ko" => "Korean",
                "ar" => "Arabic",
                "hi" => "Hindi",
                _ => languageCode
            };
        }
    }

}