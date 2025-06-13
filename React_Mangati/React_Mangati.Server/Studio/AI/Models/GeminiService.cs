using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace React_Mangati.Server.Studio.AI.Models
{
    public class GeminiService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<GeminiService> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly string _apiKey;
        private readonly string _baseUrl = "https://generativelanguage.googleapis.com/v1beta";

        public GeminiService(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiService> logger, IWebHostEnvironment env)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _apiKey = _configuration["AISettings:Gemini:ApiKey"];
            _env = env;
        }

        public async Task<AIImageResponse> GenerateImageFromTextAsync(string prompt, AIImageOptions options = null)
        {
            try
            {
                // Note: As of now, Gemini doesn't have direct image generation API
                // This is a placeholder for when Google releases Imagen API or similar
                // For now, we'll use Gemini to enhance the prompt and prepare for future image generation

                var enhancedPrompt = await EnhancePromptWithGemini(prompt);

                return new AIImageResponse
                {
                    Success = false,
                    Error = "Gemini image generation is not yet available. Enhanced prompt: " + enhancedPrompt,
                    Metadata = new Dictionary<string, object>
                    {
                        ["enhanced_prompt"] = enhancedPrompt,
                        ["original_prompt"] = prompt
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with Gemini");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        private object[] CreateParts(string prompt, List<string> images)
        {
            var parts = new List<object>();

            // Add text prompt
            parts.Add(new { text = prompt });

            // Add each image as base64
            foreach (var base64Image in images)
            {
                // Remove data URI prefix if present
                var imageData = base64Image;
                if (imageData.Contains(","))
                {
                    imageData = imageData.Substring(imageData.IndexOf(",") + 1);
                }

                parts.Add(new
                {
                    inline_data = new
                    {
                        mime_type = "image/jpeg", // You might want to detect this dynamically
                        data = imageData
                    }
                });
            }

            return parts.ToArray();
        }
        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync(string prompt, List<string> images, AIImageOptions options = null)
        {
            try
            {
                // Convert image URLs to base64 if needed
                var base64Images = await ConvertImagesToBase64(images);

                // Create the request body for Gemini API
                var requestBody = new
                {
                    contents = new[]
                    {
                new
                {
                    parts = CreateParts(prompt, base64Images)
                }
            },
                    generationConfig = new
                    {
                        temperature = options?.Temperature ?? 0.4,
                        topK = options?.TopK ?? 32,
                        topP = options?.TopP ?? 1,
                        maxOutputTokens = options?.MaxTokens ?? 2048
                    }
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // Assuming you have a configured HttpClient and API key
                var response = await _httpClient.PostAsync(
                    $"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key={_apiKey}",
                    content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<GeminiResponse>(responseContent);

                    // Extract the generated content from Gemini's response
                    var generatedText = result?.candidates?.FirstOrDefault()?.content?.parts?.FirstOrDefault()?.text;

                    return new AIImageResponse
                    {
                        Success = true,
                        GeneratedText = generatedText,
                        Metadata = new Dictionary<string, object>
                        {
                            ["image_count"] = images.Count,
                            ["model"] = "gemini-pro-vision"
                        }
                    };
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Gemini API error: {response.StatusCode} - {errorContent}");

                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"API request failed: {response.StatusCode}",
                        Metadata = new Dictionary<string, object>
                        {
                            ["status_code"] = response.StatusCode,
                            ["error_details"] = errorContent
                        }
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating content with Gemini using images");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }


        private async Task<List<string>> ConvertImagesToBase64(List<string> images)
        {
            var base64Images = new List<string>();

            foreach (var image in images)
            {
                // Check if it's already base64
                if (image.StartsWith("data:") || !image.StartsWith("http"))
                {
                    base64Images.Add(image);
                }
                else if (image.StartsWith("http://localhost") || image.StartsWith("https://localhost"))
                {
                    // Handle local file system access for localhost URLs
                    var path = GetLocalPathFromUrl(image);
                    if (File.Exists(path))
                    {
                        var imageBytes = await File.ReadAllBytesAsync(path);
                        var base64String = Convert.ToBase64String(imageBytes);
                        base64Images.Add(base64String);
                    }
                    else
                    {
                        _logger.LogError($"Local file not found: {path}");
                        throw new FileNotFoundException($"Image file not found at path: {path}");
                    }
                }
                else
                {
                    // External URL, fetch normally
                    try
                    {
                        using var response = await _httpClient.GetAsync(image);
                        if (response.IsSuccessStatusCode)
                        {
                            var imageBytes = await response.Content.ReadAsByteArrayAsync();
                            var base64String = Convert.ToBase64String(imageBytes);
                            base64Images.Add(base64String);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError($"Failed to fetch image from URL: {image}, Error: {ex.Message}");
                        throw;
                    }
                }
            }

            return base64Images;
        }

        private string GetLocalPathFromUrl(string url)
        {
            // Extract path from URL like "http://localhost:5229/uploads/studio/series/1/uploads/84c0fe3e-77b4-42cc-b8ff-a8b7b2bfb879.jpg"
            var uri = new Uri(url);
            var relativePath = uri.AbsolutePath.TrimStart('/');

            // Combine with wwwroot or content root path
            var contentRoot = _env.WebRootPath ?? _env.ContentRootPath;
            return Path.Combine(contentRoot, relativePath.Replace('/', Path.DirectorySeparatorChar));
        }
        private async Task<string> EnhancePromptWithGemini(string prompt)
        {
            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = $"Enhance this image generation prompt to be more detailed and descriptive: {prompt}" }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(
                $"{_baseUrl}/models/gemini-pro:generateContent?key={_apiKey}",
                content
            );

            if (response.IsSuccessStatusCode)
            {
                var responseJson = await response.Content.ReadAsStringAsync();
                // Parse response and extract enhanced prompt
                // This is simplified - you'd need proper parsing
                return prompt + " [Enhanced by Gemini]";
            }

            return prompt;
        }

        private async Task<string> AnalyzeImagesWithGemini(string prompt, List<string> images)
        {
            // Implement multimodal analysis with Gemini
            // This would use gemini-pro-vision model
            return "Image analysis placeholder";
        }
    }

    public class GeminiResponse
    {
        public Candidate[] candidates { get; set; }
    }

    public class Candidate
    {
        public Content content { get; set; }
    }

    public class Content
    {
        public Part[] parts { get; set; }
    }

    public class Part
    {
        public string text { get; set; }
    }
}