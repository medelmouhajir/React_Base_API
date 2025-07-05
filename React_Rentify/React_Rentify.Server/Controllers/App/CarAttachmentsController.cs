using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Cars;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/cars/{carId}/attachments")]
    [Authorize]
    public class CarAttachmentsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CarAttachmentsController> _logger;
        private readonly string _uploadsFolder;

        public CarAttachmentsController(MainDbContext context, ILogger<CarAttachmentsController> logger, IWebHostEnvironment environment)
        {
            _context = context;
            _logger = logger;
            _uploadsFolder = Path.Combine(environment.ContentRootPath, "wwwroot", "uploads", "cars");

            // Ensure the uploads folder exists
            if (!Directory.Exists(_uploadsFolder))
            {
                Directory.CreateDirectory(_uploadsFolder);
            }
        }

        /// <summary>
        /// GET: api/cars/{carId}/attachments
        /// Returns all attachments for a specific car.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAttachments(Guid carId)
        {
            _logger.LogInformation("Retrieving attachments for car {CarId}", carId);

            var carExists = await _context.Set<Car>().AnyAsync(c => c.Id == carId);
            if (!carExists)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            var attachments = await _context.Set<Car_Attachment>()
                .Where(a => a.CarId == carId)
                .ToListAsync();

            var dtoList = attachments.Select(a => new CarAttachmentDto
            {
                Id = a.Id,
                FileName = a.FileName,
                FilePath = a.FilePath,
                UploadedAt = a.UploadedAt
            }).ToList();

            _logger.LogInformation("Retrieved {Count} attachments for car {CarId}", dtoList.Count, carId);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/cars/{carId}/attachments/{id}
        /// Returns a specific attachment for a car.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAttachment(Guid carId, Guid id)
        {
            _logger.LogInformation("Retrieving attachment {AttachmentId} for car {CarId}", id, carId);

            var attachment = await _context.Set<Car_Attachment>()
                .FirstOrDefaultAsync(a => a.Id == id && a.CarId == carId);

            if (attachment == null)
            {
                _logger.LogWarning("Attachment {AttachmentId} for car {CarId} not found", id, carId);
                return NotFound(new { message = $"Attachment with Id '{id}' for car '{carId}' not found." });
            }

            var dto = new CarAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };

            _logger.LogInformation("Retrieved attachment {AttachmentId} for car {CarId}", id, carId);
            return Ok(dto);
        }

        /// <summary>
        /// POST: api/cars/{carId}/attachments
        /// Adds a new attachment to a car.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddAttachment(Guid carId, [FromBody] CreateCarAttachmentDto dto)
        {
            _logger.LogInformation("Adding attachment to car {CarId}", carId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarAttachmentDto for car {CarId}", carId);
                return BadRequest(ModelState);
            }

            var car = await _context.Set<Car>().FindAsync(carId);
            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            var attachment = new Car_Attachment
            {
                Id = Guid.NewGuid(),
                CarId = carId,
                FileName = dto.FileName,
                FilePath = dto.FilePath,
                UploadedAt = DateTime.UtcNow
            };

            _context.Set<Car_Attachment>().Add(attachment);
            await _context.SaveChangesAsync();

            var responseDto = new CarAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };

            _logger.LogInformation("Added attachment {AttachmentId} to car {CarId}", attachment.Id, carId);
            return CreatedAtAction(nameof(GetAttachment), new { carId, id = attachment.Id }, responseDto);
        }

        /// <summary>
        /// POST: api/cars/{carId}/upload
        /// Uploads a file and creates an attachment for a car.
        /// </summary>
        [HttpPost("/api/cars/{carId}/upload")]
        public async Task<IActionResult> UploadFile(Guid carId, IFormFile file)
        {
            _logger.LogInformation("Uploading file for car {CarId}", carId);

            if (file == null || file.Length == 0)
            {
                _logger.LogWarning("No file was uploaded for car {CarId}", carId);
                return BadRequest(new { message = "No file was uploaded." });
            }

            // Maximum file size (10MB)
            if (file.Length > 10 * 1024 * 1024)
            {
                _logger.LogWarning("File size exceeds the limit (10MB) for car {CarId}", carId);
                return BadRequest(new { message = "File size exceeds the limit (10MB)." });
            }

            var car = await _context.Set<Car>().FindAsync(carId);
            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            // Create folder for this car if it doesn't exist
            var carFolder = Path.Combine(_uploadsFolder, carId.ToString());
            if (!Directory.Exists(carFolder))
            {
                Directory.CreateDirectory(carFolder);
            }

            // Sanitize filename and generate unique name
            var fileName = Path.GetFileName(file.FileName);
            var safeFileName = string.Join("_", fileName.Split(Path.GetInvalidFileNameChars()));
            var uniqueFileName = $"{DateTime.UtcNow.Ticks}_{safeFileName}";
            var filePath = Path.Combine(carFolder, uniqueFileName);

            // Save the file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Create relative path for storage in database
            var relativePath = $"/uploads/cars/{carId}/{uniqueFileName}";

            // Create attachment record
            var attachment = new Car_Attachment
            {
                Id = Guid.NewGuid(),
                CarId = carId,
                FileName = fileName,
                FilePath = relativePath,
                UploadedAt = DateTime.UtcNow
            };

            _context.Set<Car_Attachment>().Add(attachment);
            await _context.SaveChangesAsync();

            var dto = new CarAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };

            _logger.LogInformation("Uploaded file {FileName} and created attachment {AttachmentId} for car {CarId}",
                fileName, attachment.Id, carId);

            return CreatedAtAction(nameof(GetAttachment), new { carId, id = attachment.Id }, dto);
        }

        /// <summary>
        /// DELETE: api/cars/{carId}/attachments/{id}
        /// Deletes an attachment from a car.
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteAttachment(Guid carId, Guid id)
        {
            _logger.LogInformation("Deleting attachment {AttachmentId} from car {CarId}", id, carId);

            var attachment = await _context.Set<Car_Attachment>()
                .FirstOrDefaultAsync(a => a.Id == id && a.CarId == carId);

            if (attachment == null)
            {
                _logger.LogWarning("Attachment {AttachmentId} for car {CarId} not found", id, carId);
                return NotFound(new { message = $"Attachment with Id '{id}' for car '{carId}' not found." });
            }

            // Try to delete the physical file if it exists
            try
            {
                var filePath = Path.Combine(_uploadsFolder, attachment.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }
            catch (Exception ex)
            {
                // Log the error but continue with removing the database record
                _logger.LogError(ex, "Error deleting file for attachment {AttachmentId}", id);
            }

            _context.Set<Car_Attachment>().Remove(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted attachment {AttachmentId} from car {CarId}", id, carId);
            return NoContent();
        }
    }

    #region DTOs

    public class CarAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class CreateCarAttachmentDto
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }

    #endregion
}