using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace React_Mangati.Server.Studio.AI.Models
{
    public class ChatGPTService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatGPTService> _logger;
        private readonly string _apiKey;
        private readonly string _baseUrl = "https://api.openai.com/v1";

        public ChatGPTService(HttpClient httpClient, IConfiguration configuration, ILogger<ChatGPTService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _apiKey = _configuration["AISettings:OpenAI:ApiKey"];

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        public async Task<AIImageResponse> GenerateImageFromTextAsync(string prompt, AIImageOptions options = null)
        {
            try
            {
                options ??= new AIImageOptions();

                var requestBody = new
                {
                    model = options.Model ?? "dall-e-3",
                    prompt = prompt,
                    n = options.Count,
                    size = $"{options.Width}x{options.Height}",
                    quality = options.Quality,
                    style = options.Style ?? "vivid"
                };

                var json = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await _httpClient.PostAsync($"{_baseUrl}/images/generations", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<DallEResponse>(responseContent);

                    return new AIImageResponse
                    {
                        Success = true,
                        ImageUrl = result.data.FirstOrDefault()?.url,
                        Metadata = new Dictionary<string, object>
                        {
                            ["model"] = options.Model ?? "dall-e-3",
                            ["revised_prompt"] = result.data.FirstOrDefault()?.revised_prompt
                        }
                    };
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"DALL-E API error: {error}");

                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"API Error: {response.StatusCode} - {error}"
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with DALL-E");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync(string prompt, List<string> images, AIImageOptions options = null)
        {
            try
            {
                // First, use GPT-4 Vision to analyze the images
                var imageAnalysis = await AnalyzeImagesWithGPT4Vision(prompt, images);

                // Then generate an enhanced prompt based on the analysis
                var enhancedPrompt = await GenerateEnhancedPrompt(prompt, imageAnalysis);

                // Finally, generate the image with DALL-E
                return await GenerateImageFromTextAsync(enhancedPrompt, options);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with reference images");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        private async Task<string> AnalyzeImagesWithGPT4Vision(string prompt, List<string> images)
        {
            var messages = new List<object>
            {
                new
                {
                    role = "user",
                    content = new List<object>
                    {
                        new { type = "text", text = $"Analyze these images and describe what you see in relation to this prompt: {prompt}" }
                    }
                }
            };

            // Add images to the message
            var contentList = messages[0].GetType().GetProperty("content").GetValue(messages[0]) as List<object>;
            foreach (var image in images)
            {
                contentList.Add(new
                {
                    type = "image_url",
                    image_url = new { url = image }
                });
            }

            var requestBody = new
            {
                model = "gpt-4-vision-preview",
                messages = messages,
                max_tokens = 300
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                // Parse and extract the analysis
                return "Image analysis from GPT-4 Vision";
            }

            return "Unable to analyze images";
        }

        private async Task<string> GenerateEnhancedPrompt(string originalPrompt, string imageAnalysis)
        {
            var requestBody = new
            {
                model = "gpt-4",
                messages = new[]
                {
                    new
                    {
                        role = "system",
                        content = "You are an expert at creating detailed image generation prompts for DALL-E."
                    },
                    new
                    {
                        role = "user",
                        content = $"Based on this original prompt: '{originalPrompt}' and this image analysis: '{imageAnalysis}', create an enhanced, detailed prompt for DALL-E image generation."
                    }
                },
                max_tokens = 200
            };

            var json = JsonSerializer.Serialize(requestBody);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync($"{_baseUrl}/chat/completions", content);

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                // Parse and extract the enhanced prompt
                return originalPrompt + " [Enhanced]";
            }

            return originalPrompt;
        }

        private class DallEResponse
        {
            public List<DallEImage> data { get; set; }
        }

        private class DallEImage
        {
            public string url { get; set; }
            public string revised_prompt { get; set; }
        }
    }
}