// React_Rentify/React_Rentify.Server/Controllers/App/AgencyAttachmentsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [Route("api/agencies")]
    [ApiController]
    public class AgencyAttachmentsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<AgencyAttachmentsController> _logger;
        private readonly IWebHostEnvironment _env;

        public AgencyAttachmentsController(
            MainDbContext context,
            ILogger<AgencyAttachmentsController> logger,
            IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        /// <summary>
        /// POST: api/agencies/{id}/attachments
        /// Adds an attachment to an agency
        /// </summary>
        [HttpPost("{id:guid}/attachments")]
        public async Task<IActionResult> AddAttachment(Guid id, [FromForm] AgencyAttachmentUploadDto dto)
        {
            try
            {
                _logger.LogInformation("Adding attachment to Agency {AgencyId}", id);

                var agency = await _context.Set<Agency>()
                    .Include(a => a.Agency_Attachments)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (agency == null)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} not found", id);
                    return NotFound(new { message = $"Agency with Id '{id}' not found." });
                }

                if (dto.File == null || dto.File.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                // Create directory if it doesn't exist
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "agencies", id.ToString());

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate a unique filename
                var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file to disk
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(fileStream);
                }

                // Create a URL-friendly path
                var urlPath = $"/uploads/agencies/{id}/{uniqueFileName}";

                // Create attachment record
                var attachment = new Agency_Attachment
                {
                    Id = Guid.NewGuid(),
                    FileName = string.IsNullOrEmpty(dto.FileName) ? dto.File.FileName : dto.FileName,
                    FilePath = urlPath,
                    AgencyId = id,
                    UploadedAt = DateTime.UtcNow
                };

                _context.Set<Agency_Attachment>().Add(attachment);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Added attachment {AttachmentId} to Agency {AgencyId}", attachment.Id, id);

                var attachmentDto = new AgencyAttachmentDto
                {
                    Id = attachment.Id,
                    FileName = attachment.FileName,
                    FilePath = attachment.FilePath,
                    UploadedAt = attachment.UploadedAt
                };

                return CreatedAtAction("GetAttachment", new { id = agency.Id, attachmentId = attachment.Id }, attachmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding attachment to Agency {AgencyId}", id);
                return StatusCode(500, new { message = "An error occurred while uploading the attachment" });
            }
        }

        /// <summary>
        /// GET: api/agencies/{id}/attachments
        /// Gets all attachments for an agency
        /// </summary>
        [HttpGet("{id:guid}/attachments")]
        public async Task<IActionResult> GetAttachments(Guid id)
        {
            try
            {
                var agency = await _context.Set<Agency>()
                    .Include(a => a.Agency_Attachments)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (agency == null)
                {
                    return NotFound(new { message = $"Agency with Id '{id}' not found." });
                }

                var attachments = agency.Agency_Attachments?
                    .Select(a => new AgencyAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList();

                return Ok(attachments);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attachments for Agency {AgencyId}", id);
                return StatusCode(500, new { message = "An error occurred while retrieving the attachments" });
            }
        }

        /// <summary>
        /// GET: api/agencies/{id}/attachments/{attachmentId}
        /// Gets a specific attachment
        /// </summary>
        [HttpGet("{id:guid}/attachments/{attachmentId:guid}")]
        public async Task<IActionResult> GetAttachment(Guid id, Guid attachmentId)
        {
            try
            {
                var attachment = await _context.Set<Agency_Attachment>()
                    .FirstOrDefaultAsync(a => a.Id == attachmentId && a.AgencyId == id);

                if (attachment == null)
                {
                    return NotFound(new { message = $"Attachment with Id '{attachmentId}' not found for Agency '{id}'." });
                }

                var attachmentDto = new AgencyAttachmentDto
                {
                    Id = attachment.Id,
                    FileName = attachment.FileName,
                    FilePath = attachment.FilePath,
                    UploadedAt = attachment.UploadedAt
                };

                return Ok(attachmentDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting attachment {AttachmentId} for Agency {AgencyId}", attachmentId, id);
                return StatusCode(500, new { message = "An error occurred while retrieving the attachment" });
            }
        }

        /// <summary>
        /// DELETE: api/agencies/{id}/attachments/{attachmentId}
        /// Deletes a specific attachment
        /// </summary>
        [HttpDelete("{id:guid}/attachments/{attachmentId:guid}")]
        public async Task<IActionResult> DeleteAttachment(Guid id, Guid attachmentId)
        {
            try
            {
                var attachment = await _context.Set<Agency_Attachment>()
                    .FirstOrDefaultAsync(a => a.Id == attachmentId && a.AgencyId == id);

                if (attachment == null)
                {
                    return NotFound(new { message = $"Attachment with Id '{attachmentId}' not found for Agency '{id}'." });
                }

                // Delete the file from disk if it exists
                var filePath = Path.Combine(_env.WebRootPath, attachment.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }

                _context.Set<Agency_Attachment>().Remove(attachment);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting attachment {AttachmentId} for Agency {AgencyId}", attachmentId, id);
                return StatusCode(500, new { message = "An error occurred while deleting the attachment" });
            }
        }

        /// <summary>
        /// POST: api/agencies/{id}/logo
        /// Updates an agency's logo
        /// </summary>
        [HttpPost("{id:guid}/logo")]
        public async Task<IActionResult> UploadLogo(Guid id, IFormFile file)
        {
            try
            {
                var agency = await _context.Set<Agency>()
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (agency == null)
                {
                    return NotFound(new { message = $"Agency with Id '{id}' not found." });
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded" });
                }

                // Create directory if it doesn't exist
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "agencies", id.ToString());
                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                // Generate a unique filename for the logo
                var uniqueFileName = $"logo_{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                // Save file to disk
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // Create a URL-friendly path
                var urlPath = $"/uploads/agencies/{id}/{uniqueFileName}";

                // Delete old logo file if it exists
                if (!string.IsNullOrEmpty(agency.LogoUrl))
                {
                    var oldLogoPath = Path.Combine(_env.WebRootPath, agency.LogoUrl.TrimStart('/'));
                    if (System.IO.File.Exists(oldLogoPath))
                    {
                        System.IO.File.Delete(oldLogoPath);
                    }
                }

                // Update agency logo URL
                agency.LogoUrl = urlPath;
                _context.Entry(agency).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new { logoUrl = urlPath });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading logo for Agency {AgencyId}", id);
                return StatusCode(500, new { message = "An error occurred while uploading the logo" });
            }
        }
    }

    public class AgencyAttachmentUploadDto
    {
        public IFormFile File { get; set; }
        public string FileName { get; set; }
    }

    public class AgencyAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}