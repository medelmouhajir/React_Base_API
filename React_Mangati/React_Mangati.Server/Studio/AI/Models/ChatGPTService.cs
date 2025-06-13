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

        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync00( string prompt, List<string> images, AIImageOptions options = null)
        {
            if (string.IsNullOrWhiteSpace(prompt))
                throw new ArgumentException("Prompt is required", nameof(prompt));

            try
            {
                // Build the content list with the correct format for OpenAI's API
                var contentList = new List<object>();

                // Add the text prompt
                contentList.Add(new { type = "text", text = prompt });

                // Process and add images
                foreach (var imagePath2 in images ?? Enumerable.Empty<string>())
                {
                    var imagePath = imagePath2.Replace("http://localhost:5229", "");

                    string base64String;
                    string mimeType;

                    // Handle local file paths
                    if (!imagePath.StartsWith("http"))
                    {
                        var fullPath = Path.Combine(_env.WebRootPath, imagePath.TrimStart('/'));

                        if (!File.Exists(fullPath))
                        {
                            _logger.LogWarning("Image file not found: {ImagePath}", fullPath);
                            continue;
                        }

                        var imageBytes = await File.ReadAllBytesAsync(fullPath);
                        base64String = Convert.ToBase64String(imageBytes);

                        var ext = Path.GetExtension(fullPath).TrimStart('.').ToLower();
                        mimeType = ext switch
                        {
                            "jpg" or "jpeg" => "image/jpeg",
                            "png" => "image/png",
                            "gif" => "image/gif",
                            "webp" => "image/webp",
                            _ => "image/jpeg"
                        };
                    }
                    else
                    {
                        // Handle URLs - download the image
                        using var response = await _httpClient.GetAsync(imagePath2);
                        if (!response.IsSuccessStatusCode)
                        {
                            _logger.LogWarning("Failed to download image from URL: {Url}", imagePath2);
                            continue;
                        }

                        var imageBytes = await response.Content.ReadAsByteArrayAsync();
                        base64String = Convert.ToBase64String(imageBytes);
                        mimeType = "image/jpeg"; // Default, or detect from Content-Type header
                    }

                    // Create data URI
                    var dataUri = $"data:{mimeType};base64,{base64String}";

                    // Add image with correct format
                    contentList.Add(new
                    {
                        type = "image_url",
                        image_url = new { url = dataUri }
                    });
                }

                // First, use GPT-4o to analyze the images and create an enhanced prompt
                var visionRequest = new
                {
                    model = "gpt-4o", // Use the current vision-capable model
                    messages = new[]
                    {
                new
                {
                    role = "user",
                    content = contentList.ToArray()
                }
            },
                    max_tokens = 300
                };

                var visionJson = JsonSerializer.Serialize(visionRequest);
                var visionContent = new StringContent(visionJson, Encoding.UTF8, "application/json");

                var visionResponse = await _httpClient.PostAsync(
                    $"{_baseUrl}/chat/completions",
                    visionContent
                );

                if (!visionResponse.IsSuccessStatusCode)
                {
                    var error = await visionResponse.Content.ReadAsStringAsync();
                    _logger.LogError("Vision API error: {Error}", error);
                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"Vision API Error: {visionResponse.StatusCode} - {error}"
                    };
                }

                var visionBody = await visionResponse.Content.ReadAsStringAsync();
                using var visionDoc = JsonDocument.Parse(visionBody);

                var analysisResult = visionDoc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                // Now use DALL-E to generate the image based on the analysis
                var imageRequest = new
                {
                    model = "dall-e-3",
                    prompt = $"{prompt}\n\nBased on reference analysis: {analysisResult}",
                    n = 1,
                    size = $"{options?.Width ?? 1024}x{options?.Height ?? 1024}",
                    quality = options?.Quality ?? "standard",
                    style = options?.Style ?? "vivid"
                };

                var imageJson = JsonSerializer.Serialize(imageRequest);
                var imageContent = new StringContent(imageJson, Encoding.UTF8, "application/json");

                var imageResponse = await _httpClient.PostAsync(
                    $"{_baseUrl}/images/generations",
                    imageContent
                );

                if (!imageResponse.IsSuccessStatusCode)
                {
                    var error = await imageResponse.Content.ReadAsStringAsync();
                    _logger.LogError("DALL-E API error: {Error}", error);
                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"Image Generation Error: {imageResponse.StatusCode} - {error}"
                    };
                }

                var imageBody = await imageResponse.Content.ReadAsStringAsync();
                var imageResult = JsonSerializer.Deserialize<DallEResponse>(imageBody);

                return new AIImageResponse
                {
                    Success = true,
                    ImageUrl = imageResult.data.First().url,
                    Metadata = new Dictionary<string, object>
                    {
                        ["model"] = options?.Model ?? "dall-e-3",
                        ["revised_prompt"] = imageResult.data.First().revised_prompt,
                        ["vision_analysis"] = analysisResult,
                        ["reference_image_count"] = images.Count
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with references");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
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
                var imagePath = Path.Combine(_env.ContentRootPath, "wwwroot", imagePath2.Replace("http://localhost:5229", ""));

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
            if (doc.RootElement.TryGetProperty("output", out var outputs) && outputs.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in outputs.EnumerateArray())
                {
                    if (item.GetProperty("type").GetString() == "image_generation_call")
                    {
                        var result = item.GetProperty("result").GetString();
                        return new AIImageResponse { Success = true, Base64Image = result };
                    }
                }
            }

            _logger.LogWarning("No image generation result found in response.");
            return null;
        }


        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync3( string prompt, List<string> images, AIImageOptions options = null)
        {
            options ??= new AIImageOptions();
            try
            {
                // Convert images to base64 if they're file paths
                var base64Images = new List<string>();
                foreach (var image2 in images)
                {
                    var image = image2.Replace("http://localhost:5229", "");
                    if (image.StartsWith("http"))
                    {
                        // Download and convert URL images to base64
                        using var response1 = await _httpClient.GetAsync(image);
                        var imageBytes = await response1.Content.ReadAsByteArrayAsync();
                        var base64 = Convert.ToBase64String(imageBytes);
                        var mimeType = GetMimeType(image);
                        base64Images.Add($"data:{mimeType};base64,{base64}");
                    }
                    else if (image.StartsWith("/") || image.StartsWith("\\"))
                    {
                        // Handle local web path (e.g., /uploads/images/ggg.png)
                        var physicalPath = Path.Combine(_env.WebRootPath, image.TrimStart('/', '\\'));

                        if (File.Exists(physicalPath))
                        {
                            var imageBytes = await File.ReadAllBytesAsync(physicalPath);
                            var base64 = Convert.ToBase64String(imageBytes);
                            var mimeType = GetMimeType(physicalPath);
                            base64Images.Add($"data:{mimeType};base64,{base64}");
                        }
                        else
                        {
                            _logger.LogWarning($"Image file not found: {physicalPath}");
                            continue;
                        }
                    }
                    else if (File.Exists(image))
                    {
                        // Handle absolute file paths
                        var imageBytes = await File.ReadAllBytesAsync(image);
                        var base64 = Convert.ToBase64String(imageBytes);
                        var mimeType = GetMimeType(image);
                        base64Images.Add($"data:{mimeType};base64,{base64}");
                    }
                    else if (image.StartsWith("data:"))
                    {
                        // Already base64 encoded
                        base64Images.Add(image);
                    }
                    else
                    {
                        _logger.LogWarning($"Unrecognized image format: {image}");
                        continue;
                    }
                }

                // Build the request for gpt-image-1 with reference images
                var imageGenerationRequest = new
                {
                    model = "gpt-image-1", // Use the new model
                    prompt = prompt,
                    image = base64Images.Take(10).ToArray(), // Maximum 10 reference images
                    size = "1024x1024",
                    quality = "medium", // low, medium, high, auto
                    n = 1,
                    output_format = "png" // png, jpeg, webp
                };

                var json = JsonSerializer.Serialize(imageGenerationRequest);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                // POST to the correct endpoint
                var response = await _httpClient.PostAsync(_baseUrl, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError("Image generation API error: {status} {body}",
                        response.StatusCode, errorContent);

                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"API Error: {response.StatusCode} - {errorContent}"
                    };
                }

                // Parse the response
                var responseBody = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseBody);

                // Get the generated image URL from the response
                var imageUrl = doc.RootElement
                    .GetProperty("data")[0]
                    .GetProperty("url")
                    .GetString();

                return new AIImageResponse
                {
                    Success = true,
                    ImageUrl = imageUrl
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with references");
                return new AIImageResponse
                {
                    Success = false,
                    Error = ex.Message
                };
            }
        }

        private string GetMimeType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            return extension switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".webp" => "image/webp",
                ".bmp" => "image/bmp",
                _ => "image/jpeg" // Default fallback
            };
        }

        public async Task<AIImageResponse> GenerateImageFromTextAndImagesAsync2( string prompt, List<string> images, AIImageOptions options = null)
        {
            options ??= new AIImageOptions();

            try
            {
                // 1. Build a single chat request with prompt + inline images as data URLs
                var contentList = new List<object>();

                //foreach (var relativePath in images)
                //{
                //    // Strip any URL prefix and map to wwwroot
                //    var clean = relativePath
                //        .Replace("http://localhost:5229", "")
                //        .TrimStart('/')
                //        .Replace('/', Path.DirectorySeparatorChar);

                //    var fullPath = Path.Combine(_env.WebRootPath, clean);

                //    // Read and encode
                //    var bytes = await File.ReadAllBytesAsync(fullPath);
                //    var b64 = Convert.ToBase64String(bytes);

                //    // Determine MIME type from extension
                //    var ext = Path.GetExtension(fullPath).ToLowerInvariant();
                //    var mime = ext switch
                //    {
                //        ".png" => "image/png",
                //        ".jpg" => "image/jpeg",
                //        ".jpeg" => "image/jpeg",
                //        _ => "application/octet-stream"
                //    };

                //    // Prepend the data URL prefix
                //    var dataUrl = $"data:{mime};base64,{b64}";

                //    contentList.Add(new
                //    {
                //        type = "image_url",
                //        image_url = new { url = dataUrl }
                //    });
                //}

                contentList.Add(new
                {
                    type = "image_url",
                    image_url = new { 
                        url = "https://i.ibb.co/CS233Qv/294998186-3292852927611817-5382728139934738121-n.jpg",
                        detail = "high"
                    }
                });


                // 2. Send to the multimodal chat endpoint
                var chatRequest = new
                {
                    model = "gpt-image-1",
                    prompt = prompt,
                    input = new[]
                    {
                        new
                        {
                            role    = "user",
                            content = contentList
                        }
                    }
                };

                var chatJson = JsonSerializer.Serialize(chatRequest);
                var chatContent = new StringContent(chatJson, Encoding.UTF8, "application/json");
                var chatResp = await _httpClient.PostAsync($"{_baseUrl}", chatContent);

                if (!chatResp.IsSuccessStatusCode)
                {
                    var err = await chatResp.Content.ReadAsStringAsync();
                    _logger.LogError($"Chat API error: {err}");
                    return new AIImageResponse
                    {
                        Success = false,
                        Error = $"Chat API Error: {chatResp.StatusCode} - {err}"
                    };
                }

                // 3. Extract the expanded prompt from the chat response
                var chatBody = await chatResp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(chatBody);
                var detailedPrompt = doc.RootElement
                    .GetProperty("choices")[0]
                    .GetProperty("message")
                    .GetProperty("content")
                    .GetString();

                // 4. Finally call DALL·E to generate the new image
                return await GenerateImageFromTextAsync(detailedPrompt, options);
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
