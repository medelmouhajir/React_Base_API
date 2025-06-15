using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Studio.Generations;
using React_Mangati.Server.Studio.AI.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace React_Mangati.Server.Controllers.Studio
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class AIStudioController : ControllerBase
    {
        private readonly IAIServiceFactory _aiServiceFactory;
        private readonly ILogger<AIStudioController> _logger;
        private readonly IWebHostEnvironment _env;
        private readonly ApplicationDbContext _context;

        public AIStudioController(IAIServiceFactory aiServiceFactory, ILogger<AIStudioController> logger, IWebHostEnvironment env , ApplicationDbContext context)
        {
            _aiServiceFactory = aiServiceFactory;
            _logger = logger;
            _env = env;
            _context = context;
        }

        [HttpPost("generate-image")]
        public async Task<IActionResult> GenerateImage([FromBody] GenerateImageRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return BadRequest("Prompt is required");
                }

                var aiService = _aiServiceFactory.GetService(AIProvider.ChatGPT);

                var options = new AIImageOptions
                {
                    Width = request.Width ?? 1024,
                    Height = request.Height ?? 1024,
                    Style = request.Style,
                    Quality = request.Quality ?? "standard",
                    Count = request.Count ?? 1
                };

                var result = await aiService.GenerateImageFromTextAsync(request.Prompt, options);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        imageUrl = result.ImageUrl,
                        base64Image = result.Base64Image,
                        metadata = result.Metadata
                    });
                }

                return BadRequest(new { success = false, error = result.Error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image");
                return StatusCode(500, new { success = false, error = "Internal server error" });
            }
        }

        [HttpPost("generate-image-with-references")]
        public async Task<IActionResult> GenerateImageWithReferences([FromBody] GenerateImageWithReferencesRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Prompt))
                {
                    return BadRequest("Prompt is required");
                }

                if (request.ReferenceImages == null || request.ReferenceImages.Count == 0)
                {
                    return BadRequest("At least one reference image is required");
                }

                var generation = new Image_Generation
                {
                    Id = Guid.NewGuid(),
                    Date_Created = DateTime.UtcNow,
                    Prompt = request.Prompt,
                    SerieId = request.SerieId,
                    Tokens = 0
                };

                await _context.Image_Generations.AddAsync(generation);
                await _context.SaveChangesAsync();

                var aiService = _aiServiceFactory.GetService( AIProvider.ChatGPT );

                var options = new AIImageOptions
                {
                    Width = request.Width ?? 1024,
                    Height = request.Height ?? 1024,
                    Style = "vivid",
                    Quality = request.Quality ?? "standard"
                };

                var result = await aiService.GenerateImageFromTextAndImagesAsync(
                    request.Prompt,
                    request.ReferenceImages,
                    options
                );

                if (result.Success)
                {
                    var path = await Save_Image_Result(result.Base64Image);

                    generation.Date_Completed = DateTime.UtcNow;
                    generation.Result_Path = path;
                    generation.Tokens = result.Tokens;

                    _context.Image_Generations.Update(generation);
                    await _context.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        imageUrl = path,
                        base64Image = result.Base64Image,
                        metadata = result.Metadata,
                        generationId = generation.Id,
                    });
                }

                return BadRequest(new { success = false, error = result.Error });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating image with references");
                return StatusCode(500, new { success = false, error = "Internal server error" });
            }
        }


        private async Task<string> Save_Image_Result(string base64)
        {
            // 1. Build disk path and ensure directory exists
            var uploadDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "studio", "generated");
            Directory.CreateDirectory(uploadDir);

            // 2. Generate a unique filename
            var fileName = $"{Guid.NewGuid()}.png";
            var fullPath = Path.Combine(uploadDir, fileName);

            // 3. Strip off data URL prefix if present
            var commaIndex = base64.IndexOf(',');
            var rawBase64 = commaIndex >= 0
                ? base64.Substring(commaIndex + 1)
                : base64;

            // 4. Decode and write to disk
            var imageBytes = Convert.FromBase64String(rawBase64);
            await System.IO.File.WriteAllBytesAsync(fullPath, imageBytes);

            // 5. Return the path where we saved it
            return $"/uploads/studio/generated/{fileName}";
        }

        [HttpGet("providers")]
        public IActionResult GetAvailableProviders()
        {
            var providers = Enum.GetValues<AIProvider>()
                .Select(p => new
                {
                    value = p.ToString(),
                    name = p.ToString(),
                    features = GetProviderFeatures(p)
                });

            return Ok(providers);
        }

        private object GetProviderFeatures(AIProvider provider)
        {
            return provider switch
            {
                AIProvider.Gemini => new
                {
                    textToImage = false, // Not yet available
                    imageWithReferences = true,
                    multimodal = true,
                    notes = "Gemini can analyze images but doesn't generate them yet"
                },
                AIProvider.ChatGPT => new
                {
                    textToImage = true,
                    imageWithReferences = true,
                    multimodal = true,
                    models = new[] { "dall-e-2", "dall-e-3" }
                },
                AIProvider.Sora => new
                {
                    textToImage = false,
                    imageWithReferences = false,
                    videoGeneration = true,
                    notes = "Sora is for video generation, not static images"
                },
                _ => new { }
            };
        }
    }

    public class GenerateImageRequest
    {
        public string Prompt { get; set; }
        public int? Width { get; set; }
        public int? Height { get; set; }
        public string Style { get; set; }
        public string Quality { get; set; }
        public int? Count { get; set; }

        public int SerieId { get; set; }
    }

    public class GenerateImageWithReferencesRequest : GenerateImageRequest
    {
        public List<string> ReferenceImages { get; set; }
    }
}