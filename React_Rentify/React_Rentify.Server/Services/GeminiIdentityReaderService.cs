using System.Text;
using System.Text.Json;

namespace React_Rentify.Server.Services
{
    public class GeminiIdentityReaderService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiIdentityReaderService> _logger;

        public GeminiIdentityReaderService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<GeminiIdentityReaderService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<object> ExtractIdentityAsync(IEnumerable<string> base64Images)
        {
            var apiKey = _configuration["Gemini:ApiKey"];
            var apiUrl = _configuration["Gemini:ApiUrl"];
            var modelName = _configuration["Gemini:IdentityModelName"];

            if (string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiUrl) || string.IsNullOrEmpty(modelName))
            {
                throw new ArgumentException("Gemini configuration is missing or incomplete.");
            }

            // Construct the correct endpoint URL
            var endpoint = $"{apiUrl}/models/{modelName}:generateContent";

            var parts = new List<object>();

            // Add images
            foreach (var base64Image in base64Images)
            {
                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = "image/jpeg", // or detect from base64
                        data = base64Image
                    }
                });
            }

            // Add text prompt for identity extraction
            parts.Add(new
            {
                text = @"Extract identity information from the provided images. Return the data in JSON format with the following structure:
{
  ""fullName"": ""extracted full name"",
  ""email"": ""extracted email"",
  ""phoneNumber"": ""extracted phone number"",
  ""nationalId"": ""extracted national ID"",
  ""passportId"": ""extracted passport ID"",
  ""licenseNumber"": ""extracted license number"",
  ""address"": ""extracted address"",
  ""dateOfBirth"": ""extracted date of birth in ISO format""
}

Only include fields that are clearly visible and readable in the images. Use null for missing fields.
*Use the fullname in the image containing the person's personal picture"
            });

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = parts.ToArray()
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            _logger.LogInformation("Sending request to Gemini API: {Endpoint}", endpoint);

            var request = new HttpRequestMessage(HttpMethod.Post, $"{endpoint}?key={apiKey}")
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };

            request.Headers.Add("x-goog-api-key", apiKey);

            var response = await _httpClient.SendAsync(request);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                _logger.LogError("Gemini API error: {StatusCode} - {Content}", response.StatusCode, errorContent);
                response.EnsureSuccessStatusCode(); // This will throw the HttpRequestException you're seeing
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Gemini API response: {Response}", responseContent);

            // Parse the Gemini response and extract the JSON content
            var geminiResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            if (geminiResponse.TryGetProperty("candidates", out var candidates) &&
                candidates.GetArrayLength() > 0)
            {
                var firstCandidate = candidates[0];
                if (firstCandidate.TryGetProperty("content", out var content) &&
                    content.TryGetProperty("parts", out var responseParts) &&
                    responseParts.GetArrayLength() > 0)
                {
                    var textPart = responseParts[0];
                    if (textPart.TryGetProperty("text", out var textElement))
                    {
                        var extractedText = textElement.GetString();

                        // Try to parse the JSON from the response
                        try
                        {
                            // Clean up the response text (remove markdown formatting if present)
                            var jsonText = extractedText?.Trim();
                            if (jsonText?.StartsWith("```json") == true)
                            {
                                jsonText = jsonText.Substring(7);
                            }
                            if (jsonText?.EndsWith("```") == true)
                            {
                                jsonText = jsonText.Substring(0, jsonText.Length - 3);
                            }

                            return JsonSerializer.Deserialize<object>(jsonText ?? "{}");
                        }
                        catch (JsonException ex)
                        {
                            _logger.LogWarning("Failed to parse extracted JSON: {Error}. Raw text: {Text}", ex.Message, extractedText);
                            // Return a basic object with the raw text
                            return new { error = "Failed to parse response", rawText = extractedText };
                        }
                    }
                }
            }

            throw new InvalidOperationException("Unexpected response format from Gemini API");
        }
    }
}