using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Filters.Cars;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CarsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CarsController> _logger;

        public CarsController(MainDbContext context, ILogger<CarsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/Cars
        /// Returns all cars (DTO), including attachments.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllCars()
        {
            _logger.LogInformation("Retrieving all cars");
            var cars = await _context.Set<Car>()
                .Include(c => c.Car_Attachments)
                .ToListAsync();

            var dtoList = cars.Select(c => new CarDto
            {
                Id = c.Id,
                AgencyId = c.AgencyId,
                Car_ModelId = c.Car_ModelId,
                Car_YearId = c.Car_YearId,
                LicensePlate = c.LicensePlate,
                Color = c.Color,
                IsAvailable = c.IsAvailable,
                Status = c.Status,
                DailyRate = c.DailyRate,
                HourlyRate = c.HourlyRate,
                DeviceSerialNumber = c.DeviceSerialNumber,
                IsTrackingActive = c.IsTrackingActive,
                Attachments = c.Car_Attachments?
                    .Select(a => new CarAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} cars", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Cars/{id}
        /// Returns a single car by Id (DTO), including attachments.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetCarById(Guid id)
        {
            _logger.LogInformation("Retrieving car with Id {CarId}", id);
            var car = await _context.Set<Car>()
                .Include(x=> x.Car_Year)
                .Include(x=> x.Car_Model)
                .ThenInclude(x=> x.Manufacturer)
                .Include(c => c.Car_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }

            var dto = new CarDto
            {
                Id = car.Id,
                AgencyId = car.AgencyId,
                Car_ModelId = car.Car_ModelId,
                Car_YearId = car.Car_YearId,
                LicensePlate = car.LicensePlate,
                Color = car.Color,
                IsAvailable = car.IsAvailable,
                Status = car.Status,
                DailyRate = car.DailyRate,
                HourlyRate = car.HourlyRate,
                DeviceSerialNumber = car.DeviceSerialNumber,
                IsTrackingActive = car.IsTrackingActive,
                Attachments = car.Car_Attachments?
                    .Select(a => new CarAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList(),
                Fields = new Car_Fields
                {
                    Model = car.Car_Model.Name,
                    Manufacturer = car.Car_Model.Manufacturer.Name,
                    Year = car.Car_Year.YearValue
                }
            };

            _logger.LogInformation("Retrieved car {CarId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Cars/agency/{agencyId}
        /// Returns all cars belonging to a given agency (DTO), including attachments.
        /// </summary>
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetCarsByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving cars for Agency {AgencyId}", agencyId);

            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == agencyId);

            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' does not exist." });
            }

            var cars = await _context.Set<Car>()
                .Where(c => c.AgencyId == agencyId)
                .Include(c => c.Car_Attachments)
                .Include(x=> x.Car_Model)
                .ThenInclude(x => x.Manufacturer)
                .Include(x=> x.Car_Year)
                .ToListAsync();

            var dtoList = cars.Select(c => new CarDto
            {
                Id = c.Id,
                AgencyId = c.AgencyId,
                Car_ModelId = c.Car_ModelId,
                Car_YearId = c.Car_YearId,
                LicensePlate = c.LicensePlate,
                Color = c.Color,
                IsAvailable = c.IsAvailable,
                Status = c.Status,
                DailyRate = c.DailyRate,
                HourlyRate = c.HourlyRate,
                DeviceSerialNumber = c.DeviceSerialNumber,
                IsTrackingActive = c.IsTrackingActive,
                Attachments = c.Car_Attachments?
                    .Select(a => new CarAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList(),
                Fields = new Car_Fields
                {
                    Manufacturer = c.Car_Model.Manufacturer.Name,
                    Model = c.Car_Model.Name,
                    Year = c.Car_Year.YearValue
                }
            }).ToList();

            _logger.LogInformation("Retrieved {Count} cars for Agency {AgencyId}", dtoList.Count, agencyId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Cars
        /// Creates a new car. Accepts CreateCarDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCar([FromBody] CreateCarDto dto)
        {
            _logger.LogInformation("Creating new car for Agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarDto received");
                return BadRequest(ModelState);
            }

            // Verify Agency exists
            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == dto.AgencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
            }

            // Verify Car_Model exists
            var modelExists = await _context.Set<Car_Model>()
                .AnyAsync(m => m.Id == dto.Car_ModelId);
            if (!modelExists)
            {
                _logger.LogWarning("Car_Model with Id {ModelId} does not exist", dto.Car_ModelId);
                return BadRequest(new { message = $"Car_Model with Id '{dto.Car_ModelId}' does not exist." });
            }

            // Verify Car_Year exists
            var yearExists = await _context.Set<Car_Year>()
                .AnyAsync(y => y.Id == dto.Car_YearId);
            if (!yearExists)
            {
                _logger.LogWarning("Car_Year with Id {YearId} does not exist", dto.Car_YearId);
                return BadRequest(new { message = $"Car_Year with Id '{dto.Car_YearId}' does not exist." });
            }

            var car = new Car
            {
                Id = Guid.NewGuid(),
                AgencyId = dto.AgencyId,
                Car_ModelId = dto.Car_ModelId,
                Car_YearId = dto.Car_YearId,
                LicensePlate = dto.LicensePlate,
                Color = dto.Color,
                IsAvailable = dto.IsAvailable,
                Status = dto.Status,
                DailyRate = dto.DailyRate,
                HourlyRate = dto.HourlyRate,
                DeviceSerialNumber = dto.DeviceSerialNumber,
                IsTrackingActive = dto.IsTrackingActive,
                Car_Attachments = new List<Car_Attachment>()
            };

            _context.Set<Car>().Add(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created car {CarId}", car.Id);

            var resultDto = new CarDto
            {
                Id = car.Id,
                AgencyId = car.AgencyId,
                Car_ModelId = car.Car_ModelId,
                Car_YearId = car.Car_YearId,
                LicensePlate = car.LicensePlate,
                Color = car.Color,
                IsAvailable = car.IsAvailable,
                Status = car.Status,
                DailyRate = car.DailyRate,
                HourlyRate = car.HourlyRate,
                DeviceSerialNumber = car.DeviceSerialNumber,
                IsTrackingActive = car.IsTrackingActive,
                Attachments = new List<CarAttachmentDto>()
            };

            return CreatedAtAction(nameof(GetCarById), new { id = car.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Cars/{id}
        /// Updates an existing car. Accepts UpdateCarDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateCar(Guid id, [FromBody] UpdateCarDto dto)
        {
            _logger.LogInformation("Updating car {CarId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateCarDto for Car {CarId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existingCar = await _context.Set<Car>()
                .Include(c => c.Car_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCar == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }

            // If Agency was changed, verify new agency
            if (existingCar.AgencyId != dto.AgencyId)
            {
                var agencyExists = await _context.Set<Agency>()
                    .AnyAsync(a => a.Id == dto.AgencyId);
                if (!agencyExists)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
                }
            }

            // If Car_Model changed, verify it
            if (existingCar.Car_ModelId != dto.Car_ModelId)
            {
                var modelExists = await _context.Set<Car_Model>()
                    .AnyAsync(m => m.Id == dto.Car_ModelId);
                if (!modelExists)
                {
                    _logger.LogWarning("Car_Model with Id {ModelId} does not exist", dto.Car_ModelId);
                    return BadRequest(new { message = $"Car_Model with Id '{dto.Car_ModelId}' does not exist." });
                }
            }

            // If Car_Year changed, verify it
            if (existingCar.Car_YearId != dto.Car_YearId)
            {
                var yearExists = await _context.Set<Car_Year>()
                    .AnyAsync(y => y.Id == dto.Car_YearId);
                if (!yearExists)
                {
                    _logger.LogWarning("Car_Year with Id {YearId} does not exist", dto.Car_YearId);
                    return BadRequest(new { message = $"Car_Year with Id '{dto.Car_YearId}' does not exist." });
                }
            }

            // Update scalar properties
            existingCar.AgencyId = dto.AgencyId;
            existingCar.Car_ModelId = dto.Car_ModelId;
            existingCar.Car_YearId = dto.Car_YearId;
            existingCar.LicensePlate = dto.LicensePlate;
            existingCar.Color = dto.Color;
            existingCar.IsAvailable = dto.IsAvailable;
            existingCar.Status = dto.Status;
            existingCar.DailyRate = dto.DailyRate;
            existingCar.HourlyRate = dto.HourlyRate;
            existingCar.DeviceSerialNumber = dto.DeviceSerialNumber;
            existingCar.IsTrackingActive = dto.IsTrackingActive;

            // Replace attachments if provided
            if (dto.Attachments != null)
            {
                _logger.LogInformation("Updating attachments for Car {CarId}", id);

                _context.Set<Car_Attachment>().RemoveRange(existingCar.Car_Attachments);

                foreach (var attachDto in dto.Attachments)
                {
                    var newAttach = new Car_Attachment
                    {
                        Id = Guid.NewGuid(),
                        FileName = attachDto.FileName,
                        FilePath = attachDto.FilePath,
                        CarId = existingCar.Id,
                        UploadedAt = DateTime.UtcNow
                    };
                    _context.Set<Car_Attachment>().Add(newAttach);
                }
            }

            _context.Entry(existingCar).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated car {CarId}", id);

            var resultDto = new CarDto
            {
                Id = existingCar.Id,
                AgencyId = existingCar.AgencyId,
                Car_ModelId = existingCar.Car_ModelId,
                Car_YearId = existingCar.Car_YearId,
                LicensePlate = existingCar.LicensePlate,
                Color = existingCar.Color,
                IsAvailable = existingCar.IsAvailable,
                Status = existingCar.Status,
                DailyRate = existingCar.DailyRate,
                HourlyRate = existingCar.HourlyRate,
                DeviceSerialNumber = existingCar.DeviceSerialNumber,
                IsTrackingActive = existingCar.IsTrackingActive,
                Attachments = existingCar.Car_Attachments?
                    .Select(a => new CarAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/Cars/{id}
        /// Deletes a car and its attachments.
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteCar(Guid id)
        {
            _logger.LogInformation("Deleting car {CarId}", id);

            var car = await _context.Set<Car>()
                .Include(c => c.Car_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }

            if (car.Car_Attachments != null && car.Car_Attachments.Any())
            {
                _logger.LogInformation("Removing {Count} attachments for Car {CarId}", car.Car_Attachments.Count, id);
                _context.Set<Car_Attachment>().RemoveRange(car.Car_Attachments);
            }

            _context.Set<Car>().Remove(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted car {CarId}", id);
            return NoContent();
        }

        /// <summary>
        /// POST: api/Cars/{id}/attachments
        /// Adds an attachment to an existing car.
        /// </summary>
        [HttpPost("{id:guid}/attachments")]
        public async Task<IActionResult> AddAttachmentToCar(Guid id, [FromBody] CreateCarAttachmentDto dto)
        {
            _logger.LogInformation("Adding attachment to Car {CarId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarAttachmentDto for Car {CarId}", id);
                return BadRequest(ModelState);
            }

            var car = await _context.Set<Car>()
                .Include(c => c.Car_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }

            var attachment = new Car_Attachment
            {
                Id = Guid.NewGuid(),
                FileName = dto.FileName,
                FilePath = dto.FilePath,
                CarId = id,
                UploadedAt = DateTime.UtcNow
            };

            _context.Set<Car_Attachment>().Add(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added attachment {AttachmentId} to Car {CarId}", attachment.Id, id);

            var attachmentDto = new CarAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };

            return CreatedAtAction(nameof(GetCarById), new { id = car.Id }, attachmentDto);
        }
    }

    #region DTOs

    public class CarDto
    {
        public Guid Id { get; set; }
        public Guid AgencyId { get; set; }
        public string Car_ModelId { get; set; }
        public int Car_YearId { get; set; }
        public string LicensePlate { get; set; }
        public string Color { get; set; }
        public bool IsAvailable { get; set; }
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }
        public List<CarAttachmentDto>? Attachments { get; set; }

        public Car_Fields? Fields { get; set; }
    }

    public class Car_Fields
    {
        public string Manufacturer { get; set; }
        public string Model { get; set; }
        public int Year { get; set; }
    }

    public class CreateCarDto
    {
        public Guid AgencyId { get; set; }
        public string Car_ModelId { get; set; }
        public int Car_YearId { get; set; }
        public string LicensePlate { get; set; }
        public string Color { get; set; }
        public bool IsAvailable { get; set; } = true;
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; } = true;
    }

    public class UpdateCarDto
    {
        public Guid Id { get; set; }
        public Guid AgencyId { get; set; }
        public string Car_ModelId { get; set; }
        public int Car_YearId { get; set; }
        public string LicensePlate { get; set; }
        public string Color { get; set; }
        public bool IsAvailable { get; set; }
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }

        /// <summary>
        /// Optional: if provided, replaces the existing attachments.
        /// </summary>
        public List<CreateCarAttachmentDto>? Attachments { get; set; }
    }

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
