using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using React_Rentify.Server.Services;

namespace React_Rentify.Server.Controllers.AI
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class IdentityController : ControllerBase
    {
        private readonly GeminiIdentityReaderService _readerService;
        private readonly ILogger<IdentityController> _logger;

        public IdentityController(
            GeminiIdentityReaderService readerService,
            ILogger<IdentityController> logger)
        {
            _readerService = readerService;
            _logger = logger;
        }

        /// <summary>
        /// POST: api/Identity/extract
        /// Upload 1–6 images (multipart/form‑data) to extract identity fields.
        /// </summary>
        [HttpPost("extract")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Extract([FromForm] List<IFormFile> images)
        {
            if (images == null || images.Count < 1 || images.Count > 6)
            {
                return BadRequest(new { message = "You must upload between 1 and 6 images." });
            }

            try
            {
                var base64Images = new List<string>();
                foreach (var file in images)
                {
                    using var ms = new MemoryStream();
                    await file.CopyToAsync(ms);
                    base64Images.Add(Convert.ToBase64String(ms.ToArray()));
                }

                var customer = await _readerService.ExtractIdentityAsync(base64Images);
                return Ok(customer);
            }
            catch (ArgumentException argEx)
            {
                _logger.LogWarning(argEx, "Invalid image input");
                return BadRequest(new { message = argEx.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to extract identity");
                return StatusCode(500, new { message = "An error occurred while processing your request." });
            }
        }
    }
}
