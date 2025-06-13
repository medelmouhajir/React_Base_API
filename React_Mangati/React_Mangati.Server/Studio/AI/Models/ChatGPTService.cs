using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using React_Mangati.Server.Models.Series;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace React_Mangati.Server.Studio.AI.Models
{
    public class ChatGPTService : IAIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ChatGPTService> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly string _apiKey;
        private readonly string _baseUrl = "https://api.openai.com/v1";

        public ChatGPTService(
            HttpClient httpClient,
            IConfiguration configuration,
            ILogger<ChatGPTService> logger,
            IWebHostEnvironment env)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
            _env = env;
            _apiKey = _configuration["AISettings:OpenAI:ApiKey"];

            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", _apiKey);
        }

        public async Task<AIImageResponse> GenerateImageFromTextAsync(
            string prompt,
            AIImageOptions options = null)
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

            var content = new StringContent(
                JsonSerializer.Serialize(requestBody),
                Encoding.UTF8,
                "application/json");

            var response = await _httpClient.PostAsync(
                $"{_baseUrl}/images/generations",
                content);

            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync();
                _logger.LogError($"DALL·E API error: {err}");
                return new AIImageResponse
                {
                    Success = false,
                    Error = $"API Error: {response.StatusCode} - {err}"
                };
            }

            var body = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<DallEResponse>(body);

            return new AIImageResponse
            {
                Success = true,
                ImageUrl = result.data.First().url,
                Metadata = new Dictionary<string, object>
                {
                    ["model"] = options.Model ?? "dall-e-3",
                    ["revised_prompt"] = result.data.First().revised_prompt
                }
            };
        }


        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync( string prompt, List<string> images, AIImageOptions options = null)
        {
            if (string.IsNullOrWhiteSpace(prompt))
                throw new ArgumentException("Prompt is required", nameof(prompt));

            // Build the content list: first the prompt, then each image as base64 data URI
            var contentList = new List<object>
            {
                new { type = "input_text", text = prompt }
            };

            foreach (var imagePath2 in images ?? Enumerable.Empty<string>())
            {
                string relativePath = imagePath2.Replace("http://localhost:5229", "").TrimStart('/');

                // Combine with the wwwroot path to get the physical path
                string imagePath = Path.Combine(_env.WebRootPath, relativePath);

                // Check if file exists
                if (!File.Exists(imagePath))
                {
                    _logger.LogWarning("Image file not found: {ImagePath}", imagePath);
                    continue;
                }

                // Encode file to base64
                var imageBytes = await File.ReadAllBytesAsync(imagePath);
                var ext = Path.GetExtension(imagePath).TrimStart('.').ToLower();
                var mimeType = ext switch
                {
                    "jpg" or "jpeg" => "image/jpeg",
                    "png" => "image/png",
                    _ => "application/octet-stream"
                };
                var base64 = Convert.ToBase64String(imageBytes);
                var dataUri = $"data:{mimeType};base64,{base64}";

                contentList.Add(new
                {
                    type = "input_image",
                    image_url = dataUri
                });
            }

            // Build request payload
            var payload = new
            {
                model = "gpt-4.1",
                input = new[]
                {
                    new
                    {
                        role = "user",
                        content = contentList
                    }
                },
                tools = new[]
                {
                    new { type = "image_generation" }
                }
                // TODO: incorporate options.Width, options.Height if needed
            };

            var jsonContent = JsonSerializer.Serialize(payload);
            using var requestMessage = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/responses")
            {
                Content = new StringContent(jsonContent, Encoding.UTF8, "application/json")
            };

            var response = await _httpClient.SendAsync(requestMessage);
            var responseJson = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("OpenAI API error: {StatusCode} - {Body}", response.StatusCode, responseJson);
                throw new HttpRequestException($"OpenAI API returned {response.StatusCode}: {responseJson}");
            }

            // Parse output for image_generation_call
            using var doc = JsonDocument.Parse(responseJson);


            // 1) Extract the total tokens from the "usage" section
            int totalTokens = 0;
            if (doc.RootElement.TryGetProperty("usage", out var usage))
            {
                // Some endpoints call it "total_tokens"; adjust if yours differs.
                totalTokens = usage.GetProperty("total_tokens").GetInt32();
            }


            if (doc.RootElement.TryGetProperty("output", out var outputs) && outputs.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in outputs.EnumerateArray())
                {
                    if (item.GetProperty("type").GetString() == "image_generation_call")
                    {
                        var result = item.GetProperty("result").GetString();
                        return new AIImageResponse { Success = true, Base64Image = result , Tokens = totalTokens };
                    }
                }
            }

            _logger.LogWarning("No image generation result found in response.");
            return null;
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
