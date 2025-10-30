using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Controllers.App;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Filters.Cars;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Threading.Tasks;
using static React_Rentify.Server.Controllers.App.ReservationsController;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Owner,Manager")]
    public class CarsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CarsController> _logger;
        private readonly IAgencyAuthorizationService _authService;
        private readonly IWebHostEnvironment _env;

        public CarsController(MainDbContext context, ILogger<CarsController> logger, IAgencyAuthorizationService authService, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
            _env = env;
        }

        /// <summary>
        /// GET: api/Cars
        /// Returns all cars (DTO), including attachments.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllCars()
        {
            _logger.LogInformation("Retrieving all cars");
            var cars = await _context.Set<Car>()
                .Include(x => x.Car_Year)
                .Include(x => x.Car_Model)
                .ThenInclude(x => x.Manufacturer)
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
                    .ToList(),
                Fields = new Car_Fields
                {
                    Manufacturer = c.Car_Model.Manufacturer.Name,
                    Model = c.Car_Model.Name,
                    Year = c.Car_Year.YearValue
                }
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
                .Include(c => c.Car_Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (car == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

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
                },
                CurrentKM = car.CurrentKM,
                LastKmUpdate = car.LastKmUpdate,
                Images = car.Car_Images.Select(x=> new Car_Details_Image_DTO
                {
                    IsMainImage = x.IsMainImage,
                    Path = x.Path,
                }).ToList(),
                Engine = car.Engine_Type.ToString(),
                Gear = car.Gear_Type.ToString(),
                AssuranceEndDate = car.AssuranceEndDate,
                AssuranceName = car.AssuranceName,
                AssuranceStartDate = car.AssuranceStartDate,
                TechnicalVisitEndDate = car.TechnicalVisitEndDate,
                TechnicalVisitStartDate = car.TechnicalVisitStartDate
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


            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();


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
                .Include(x=> x.Car_Images)
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
                },
                AssuranceName = c.AssuranceName,
                AssuranceStartDate = c.AssuranceStartDate,
                AssuranceEndDate = c.AssuranceEndDate,
                TechnicalVisitStartDate = c.TechnicalVisitStartDate,
                TechnicalVisitEndDate = c.TechnicalVisitEndDate,
                Images = c.Car_Images.Select(x=> new Car_Details_Image_DTO
                {
                    IsMainImage = x.IsMainImage,
                    Path = x.Path
                }).ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} cars for Agency {AgencyId}", dtoList.Count, agencyId);
            return Ok(dtoList);
        }


        [HttpGet("gps/{agencyId:guid}")]
        public async Task<IActionResult> GetGPSCarsByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving cars for Agency {AgencyId}", agencyId);


            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            try
            {
                var cars = await _context.Set<Car>()
                    .Where(c => c.AgencyId == agencyId && c.IsTrackingActive && !string.IsNullOrEmpty(c.DeviceSerialNumber))
                    .Include(x => x.Car_Model)
                    .ThenInclude(x => x.Manufacturer)
                    .Include(x => x.Car_Year)
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
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        /// <summary>
        /// GET: api/Cars/agency/{agencyId}/available?startDate={startDate}&endDate={endDate}
        /// Returns available cars for a specific agency within the given date range (no overlapping reservations).
        /// </summary>
        [HttpGet("agency/{agencyId:guid}/available")]
        public async Task<IActionResult> GetCarsByAgencyIdAndDates( Guid agencyId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            _logger.LogInformation("Retrieving available cars for agency {AgencyId} between {StartDate} and {EndDate}",
                agencyId, startDate, endDate);

            // Validate date range
            if (startDate >= endDate)
            {
                _logger.LogWarning("Invalid date range: StartDate {StartDate} must be before EndDate {EndDate}", startDate, endDate);
                return BadRequest(new { message = "Start date must be before end date." });
            }

            // Check if agency exists
            var agencyExists = await _context.Set<Agency>().AnyAsync(a => a.Id == agencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' not found." });
            }

            // Check authorization to access this agency
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            // Get cars with overlapping reservations in the date range
            var carsWithReservations = await _context.Set<Reservation>()
                .Where(r => r.AgencyId == agencyId)
                .Where(r => r.Status != "Cancelled" && r.Status != "Completed")
                .Where(r =>
                    (startDate.ToUniversalTime() >= r.StartDate && startDate.ToUniversalTime() < r.EndDate) || // Start date falls within existing reservation
                    (endDate.ToUniversalTime() > r.StartDate && endDate.ToUniversalTime() <= r.EndDate) ||     // End date falls within existing reservation
                    (startDate.ToUniversalTime() <= r.StartDate && endDate.ToUniversalTime() >= r.EndDate))    // New reservation completely contains existing reservation
                .Select(r => r.CarId)
                .Distinct()
                .ToListAsync();

            // Get all available cars from the agency excluding those with reservations
            var availableCars = await _context.Set<Car>()
                .Include(c => c.Car_Year)
                .Include(c => c.Car_Model)
                .ThenInclude(m => m.Manufacturer)
                .Where(c => c.AgencyId == agencyId)
                .Where(c => c.Status != "Retired")
                .Where(c => !carsWithReservations.Contains(c.Id))
                .ToListAsync();

            var dtoList = availableCars.Select(c => new CarDto
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
                CurrentKM = c.CurrentKM,
                LastKmUpdate = c.LastKmUpdate,
                DeviceSerialNumber = c.DeviceSerialNumber,
                IsTrackingActive = c.IsTrackingActive,

                Fields = new Car_Fields
                {
                    Manufacturer = c.Car_Model?.Manufacturer?.Name ?? "Unknown",
                    Model = c.Car_Model?.Name ?? "Unknown",
                    Year = c.Car_Year?.YearValue ?? 0
                }
            }).ToList();

            _logger.LogInformation("Retrieved {Count} available cars for agency {AgencyId} in date range", dtoList.Count, agencyId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Cars
        /// Creates a new car. Accepts CreateCarDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCar([FromForm] CreateCarDto dto)
        {
            _logger.LogInformation("Creating new car for Agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarDto received");
                return BadRequest(ModelState);
            }


            if (!await _authService.HasAccessToAgencyAsync(dto.AgencyId))
                return Unauthorized();

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
                IsAvailable = true,
                Status = "Available",
                DailyRate = dto.DailyRate,
                IsTrackingActive = false,
                Car_Attachments = new List<Car_Attachment>(),
                Gear_Type = dto.Gear_Type,
                Engine_Type = dto.Engine_Type,
                AssuranceName = dto.AssuranceName,
                AssuranceEndDate = dto.AssuranceEndDate,
                AssuranceStartDate = dto.AssuranceStartDate,
                TechnicalVisitEndDate = dto.TechnicalVisitEndDate,
                TechnicalVisitStartDate = dto.TechnicalVisitStartDate,
                CurrentKM = dto.CurrentKM
            };

            _context.Set<Car>().Add(car);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created car {CarId}", car.Id);

            if( dto.Images != null )
            {
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "agencies", car.AgencyId.ToString(), "cars", car.Id.ToString());

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(uploadsFolder);
                }

                List<Car_Image> images = new List<Car_Image>();

                foreach ( var image in dto.Images )
                {
                    var uniqueFileName = $"image_{Guid.NewGuid()}{Path.GetExtension(image.Image.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fileStream = new FileStream(filePath, FileMode.Create))
                    {
                        await image.Image.CopyToAsync(fileStream);
                    }

                    // Create a URL-friendly path
                    var urlPath = $"/uploads/agencies/{car.AgencyId}/cars/{car.Id}/{uniqueFileName}";

                    images.Add(new Car_Image
                    {
                        CarId = car.Id,
                        IsMainImage = image.IsMain,
                        Path = urlPath,
                        Id = new Guid()
                    });
                }

                await _context.Set<Car_Image>().AddRangeAsync(images);
                await _context.SaveChangesAsync();

            }

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
        public async Task<IActionResult> UpdateCar(Guid id, [FromForm] UpdateCarDto dto)
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
                .Include(c => c.Car_Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCar == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", id);
                return NotFound(new { message = $"Car with Id '{id}' not found." });
            }

            // Authorization on current agency
            if (!await _authService.HasAccessToAgencyAsync(existingCar.AgencyId))
                return Unauthorized();

            // If Agency changed, verify and also ensure the caller has access to the target agency
            if (existingCar.AgencyId != dto.AgencyId)
            {
                var agencyExists = await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId);
                if (!agencyExists)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
                }

                if (!await _authService.HasAccessToAgencyAsync(dto.AgencyId))
                    return Unauthorized();
            }

            // If Car_Model changed, verify
            if (existingCar.Car_ModelId != dto.Car_ModelId)
            {
                var modelExists = await _context.Set<Car_Model>().AnyAsync(m => m.Id == dto.Car_ModelId);
                if (!modelExists)
                {
                    _logger.LogWarning("Car_Model with Id {ModelId} does not exist", dto.Car_ModelId);
                    return BadRequest(new { message = $"Car_Model with Id '{dto.Car_ModelId}' does not exist." });
                }
            }

            // If Car_Year changed, verify
            if (existingCar.Car_YearId != dto.Car_YearId)
            {
                var yearExists = await _context.Set<Car_Year>().AnyAsync(y => y.Id == dto.Car_YearId);
                if (!yearExists)
                {
                    _logger.LogWarning("Car_Year with Id {YearId} does not exist", dto.Car_YearId);
                    return BadRequest(new { message = $"Car_Year with Id '{dto.Car_YearId}' does not exist." });
                }
            }

            // Validate legal dates if provided
            if (dto.AssuranceStartDate.HasValue && dto.AssuranceEndDate.HasValue &&
                dto.AssuranceStartDate.Value >= dto.AssuranceEndDate.Value)
            {
                return BadRequest(new { message = "Insurance start date must be before end date." });
            }

            if (dto.TechnicalVisitStartDate.HasValue && dto.TechnicalVisitEndDate.HasValue &&
                dto.TechnicalVisitStartDate.Value >= dto.TechnicalVisitEndDate.Value)
            {
                return BadRequest(new { message = "Technical visit start date must be before end date." });
            }

            // Update scalar properties
            existingCar.AgencyId = dto.AgencyId;
            existingCar.Car_ModelId = dto.Car_ModelId;
            existingCar.Car_YearId = dto.Car_YearId;
            existingCar.LicensePlate = dto.LicensePlate?.Trim();
            existingCar.Color = dto.Color;
            existingCar.IsAvailable = dto.IsAvailable;
            existingCar.Status = dto.Status;
            existingCar.DailyRate = dto.DailyRate;
            existingCar.HourlyRate = dto.HourlyRate;

            existingCar.DeviceSerialNumber = string.IsNullOrWhiteSpace(dto.DeviceSerialNumber)
                ? null
                : dto.DeviceSerialNumber.Trim();

            existingCar.IsTrackingActive = dto.IsTrackingActive;

            // Powertrain
            existingCar.Gear_Type = dto.Gear_Type;
            existingCar.Engine_Type = dto.Engine_Type;

            // Odometer with timestamp bump if changed
            if (dto.CurrentKM.HasValue && dto.CurrentKM.Value != existingCar.CurrentKM)
            {
                existingCar.CurrentKM = dto.CurrentKM.Value;
                existingCar.LastKmUpdate = DateTime.UtcNow;
            }

            // Legal docs (optional)
            if (dto.AssuranceName != null) existingCar.AssuranceName = dto.AssuranceName;
            if (dto.AssuranceStartDate.HasValue)
                existingCar.AssuranceStartDate = dto.AssuranceStartDate.Value.ToUniversalTime();
            if (dto.AssuranceEndDate.HasValue)
                existingCar.AssuranceEndDate = dto.AssuranceEndDate.Value.ToUniversalTime();

            if (dto.TechnicalVisitStartDate.HasValue)
                existingCar.TechnicalVisitStartDate = dto.TechnicalVisitStartDate.Value.ToUniversalTime();
            if (dto.TechnicalVisitEndDate.HasValue)
                existingCar.TechnicalVisitEndDate = dto.TechnicalVisitEndDate.Value.ToUniversalTime();

            // Attachments: remove specific ones, then replace or append
            if (dto.AttachmentIdsToRemove != null && dto.AttachmentIdsToRemove.Count > 0)
            {
                var toRemove = existingCar.Car_Attachments
                    .Where(a => dto.AttachmentIdsToRemove.Contains(a.Id))
                    .ToList();
                if (toRemove.Count > 0)
                    _context.Set<Car_Attachment>().RemoveRange(toRemove);
            }

            if (dto.AttachmentsReplace == true)
            {
                if (existingCar.Car_Attachments?.Count > 0)
                    _context.Set<Car_Attachment>().RemoveRange(existingCar.Car_Attachments);
                existingCar.Car_Attachments = new List<Car_Attachment>();
            }

            if (dto.Attachments != null && dto.Attachments.Count > 0)
            {
                var newAttachments = dto.Attachments.Select(a => new Car_Attachment
                {
                    Id = Guid.NewGuid(),
                    CarId = existingCar.Id,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    UploadedAt = DateTime.UtcNow
                }).ToList();

                await _context.Set<Car_Attachment>().AddRangeAsync(newAttachments);
            }

            // Images: remove requested, then add new files, and set main
            if (dto.ImageIdsToRemove != null && dto.ImageIdsToRemove.Count > 0)
            {
                var imgsToRemove = existingCar.Car_Images
                    .Where(i => dto.ImageIdsToRemove.Contains(i.Id))
                    .ToList();
                if (imgsToRemove.Count > 0)
                    _context.Set<Car_Image>().RemoveRange(imgsToRemove);
            }

            Guid? lastAddedMainImageId = null;

            if (dto.ImagesToAdd != null && dto.ImagesToAdd.Count > 0)
            {
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "agencies", existingCar.AgencyId.ToString(), "cars", existingCar.Id.ToString());

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var newImages = new List<Car_Image>();

                foreach (var img in dto.ImagesToAdd)
                {
                    if (img?.Image == null || img.Image.Length == 0) continue;

                    var uniqueFileName = $"image_{Guid.NewGuid()}{Path.GetExtension(img.Image.FileName)}";
                    var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                    using (var fs = new FileStream(filePath, FileMode.Create))
                    {
                        await img.Image.CopyToAsync(fs);
                    }

                    var urlPath = $"/uploads/agencies/{existingCar.AgencyId}/cars/{existingCar.Id}/{uniqueFileName}";
                    var newId = Guid.NewGuid();

                    newImages.Add(new Car_Image
                    {
                        Id = newId,
                        CarId = existingCar.Id,
                        Path = urlPath,
                        IsMainImage = img.IsMain
                    });

                    if (img.IsMain) lastAddedMainImageId = newId;
                }

                if (newImages.Count > 0)
                    await _context.Set<Car_Image>().AddRangeAsync(newImages);
            }

            // Main image resolution: priority to explicit MainImageId, then last added with IsMain=true
            Guid? desiredMainId = dto.MainImageId ?? lastAddedMainImageId;

            if (desiredMainId.HasValue)
            {
                // Clear all then set the desired one
                foreach (var im in existingCar.Car_Images)
                    im.IsMainImage = false;

                // It may be one of the newly added images that are not tracked via existingCar.Car_Images yet
                var existingMain = existingCar.Car_Images.FirstOrDefault(i => i.Id == desiredMainId.Value);
                if (existingMain != null)
                {
                    existingMain.IsMainImage = true;
                }
                else
                {
                    // Mark in DB anyway
                    var justAdded = await _context.Set<Car_Image>().FirstOrDefaultAsync(i => i.Id == desiredMainId.Value);
                    if (justAdded != null)
                        justAdded.IsMainImage = true;
                }
            }
            else
            {
                // If multiple mains exist after adds, keep only the latest one as main
                var mains = existingCar.Car_Images.Where(i => i.IsMainImage).ToList();
                if (mains.Count > 1)
                {
                    foreach (var im in mains) im.IsMainImage = false;
                    mains.Last().IsMainImage = true;
                }
            }

            _context.Entry(existingCar).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated car {CarId}", id);

            // Return refreshed CarDto
            var refreshed = await _context.Set<Car>()
                .Include(c => c.Car_Model).ThenInclude(m => m.Manufacturer)
                .Include(c => c.Car_Year)
                .Include(c => c.Car_Attachments)
                .Include(c => c.Car_Images)
                .FirstOrDefaultAsync(c => c.Id == id);

            var dtoOut = new CarDto
            {
                Id = refreshed.Id,
                AgencyId = refreshed.AgencyId,
                Car_ModelId = refreshed.Car_ModelId,
                Car_YearId = refreshed.Car_YearId,
                LicensePlate = refreshed.LicensePlate,
                Color = refreshed.Color,
                IsAvailable = refreshed.IsAvailable,
                Status = refreshed.Status,
                DailyRate = refreshed.DailyRate,
                HourlyRate = refreshed.HourlyRate,
                DeviceSerialNumber = refreshed.DeviceSerialNumber,
                IsTrackingActive = refreshed.IsTrackingActive,
                Fields = new Car_Fields
                {
                    Manufacturer = refreshed.Car_Model?.Manufacturer?.Name,
                    Model = refreshed.Car_Model?.Name,
                    Year = refreshed.Car_Year?.YearValue ?? 0
                },
                CurrentKM = refreshed.CurrentKM,
                LastKmUpdate = refreshed.LastKmUpdate,
                Engine = refreshed.Engine_Type.ToString(),
                Gear = refreshed.Gear_Type.ToString(),
                AssuranceName = refreshed.AssuranceName,
                AssuranceStartDate = refreshed.AssuranceStartDate,
                AssuranceEndDate = refreshed.AssuranceEndDate,
                TechnicalVisitStartDate = refreshed.TechnicalVisitStartDate,
                TechnicalVisitEndDate = refreshed.TechnicalVisitEndDate,
                Attachments = refreshed.Car_Attachments?.Select(a => new CarAttachmentDto
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    FilePath = a.FilePath,
                    UploadedAt = a.UploadedAt
                }).ToList(),
                Images = refreshed.Car_Images?.Select(i => new Car_Details_Image_DTO
                {
                    Path = i.Path,
                    IsMainImage = i.IsMainImage
                }).ToList()
            };

            return Ok(dtoOut);
        }



        /// <summary>
        /// GET: api/Cars/{carId}/reservations/date/{date}
        /// Returns all reservations for a specific car on a specific date
        /// </summary>
        [HttpGet("{carId:guid}/reservations/date/{date}")]
        public async Task<IActionResult> GetCarReservationsByDate(Guid carId, string date)
        {
            _logger.LogInformation("Retrieving reservations for car {CarId} on date {Date}", carId, date);

            // Validate car exists
            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();

            // Parse the date
            if (!DateTime.TryParse(date, out DateTime targetDate))
            {
                _logger.LogWarning("Invalid date format: {Date}", date);
                return BadRequest(new { message = "Invalid date format. Use YYYY-MM-DD." });
            }

            targetDate = targetDate.ToUniversalTime();

            try
            {
                // Get reservations that overlap with the target date
                var reservations = await _context.Set<Reservation>()
                    .Where(r => r.CarId == carId &&
                               r.StartDate.Date <= targetDate.Date &&
                               r.EndDate.Date >= targetDate.Date)
                    .Include(r => r.Agency)
                    .Include(r => r.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                    .Include(r => r.Reservation_Customers)
                    .ThenInclude(rc => rc.Customer)
                    .Include(r => r.Invoice)
                    .ToListAsync();

                var dtoList = reservations.Select(r => new ReservationDto
                {
                    Id = r.Id,
                    AgencyId = r.AgencyId,
                    AgencyName = r.Agency?.Name,
                    CarId = r.CarId,
                    CarLicensePlate = r.Car?.LicensePlate,
                    Model = r.Car?.Car_Model != null ?
                        $"{r.Car.Car_Model.Manufacturer?.Name} {r.Car.Car_Model.Name}" : null,
                    StartDate = r.StartDate,
                    EndDate = r.EndDate,
                    ActualStartTime = r.ActualStartTime,
                    ActualEndTime = r.ActualEndTime,
                    Status = r.Status,
                    AgreedPrice = r.AgreedPrice,
                    FinalPrice = r.FinalPrice,
                    OdometerStart = r.OdometerStart,
                    OdometerEnd = r.OdometerEnd,
                    FuelLevelStart = r.FuelLevelStart,
                    FuelLevelEnd = r.FuelLevelEnd,
                    PickupLocation = r.PickupLocation,
                    DropoffLocation = r.DropoffLocation,
                    Reservation_Customers = r.Reservation_Customers?.Select(rc => new ReservationCustomerDto
                    {
                        ReservationId = rc.ReservationId,
                        CustomerId = rc.CustomerId,
                        Customer = rc.Customer != null ? new CustomerBasicDto
                        {
                            Id = rc.Customer.Id,
                            Name = rc.Customer.FullName,
                            Email = rc.Customer.Email,
                            Phone = rc.Customer.PhoneNumber
                        } : null
                    }).ToList()
                }).ToList();

                _logger.LogInformation("Found {Count} reservations for car {CarId} on {Date}",
                    dtoList.Count, carId, date);

                return Ok(dtoList);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving reservations for car {CarId} on {Date}", carId, date);
                return StatusCode(500, new { message = "An error occurred while retrieving reservations." });
            }
        }

        /// <summary>
        /// DELETE: api/Cars/{id}
        /// Deletes a car and its attachments.
        /// </summary>
        [Authorize(Roles = "Owner")]
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


            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

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

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

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


        /// <summary>
        /// PUT: api/Cars/{id}/insurance
        /// Updates insurance information for a specific car
        /// </summary>
        [HttpPut("{id:guid}/insurance")]
        public async Task<IActionResult> UpdateCarInsurance(Guid id, [FromBody] UpdateCarInsuranceDto dto)
        {
            _logger.LogInformation("Updating insurance information for car {CarId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateCarInsuranceDto received for car {CarId}", id);
                return BadRequest(ModelState);
            }

            try
            {
                var existingCar = await _context.Set<Car>()
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existingCar == null)
                {
                    _logger.LogWarning("Car with Id {CarId} not found", id);
                    return NotFound(new { message = $"Car with Id '{id}' not found." });
                }

                // Check agency authorization
                if (!await _authService.HasAccessToAgencyAsync(existingCar.AgencyId))
                {
                    _logger.LogWarning("Unauthorized access attempt to car {CarId} from agency {AgencyId}", id, existingCar.AgencyId);
                    return Unauthorized();
                }

                // Validate dates if provided
                if (dto.AssuranceStartDate.HasValue && dto.AssuranceEndDate.HasValue)
                {
                    if (dto.AssuranceStartDate.Value >= dto.AssuranceEndDate.Value)
                    {
                        return BadRequest(new { message = "Insurance start date must be before end date." });
                    }
                }

                // Update insurance fields
                existingCar.AssuranceName = dto.AssuranceName;
                existingCar.AssuranceStartDate = dto.AssuranceStartDate.HasValue ? dto.AssuranceStartDate.Value.ToUniversalTime() : dto.AssuranceStartDate;
                existingCar.AssuranceEndDate = dto.AssuranceEndDate.HasValue ? dto.AssuranceEndDate.Value.ToUniversalTime() : dto.AssuranceEndDate;

                _context.Entry(existingCar).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated insurance information for car {CarId}", id);

                return Ok(new { message = "Insurance information updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating insurance information for car {CarId}", id);
                return StatusCode(500, new { message = "An error occurred while updating insurance information." });
            }
        }

        /// <summary>
        /// PUT: api/Cars/{id}/technical-visit
        /// Updates technical visit information for a specific car
        /// </summary>
        [HttpPut("{id:guid}/technical-visit")]
        public async Task<IActionResult> UpdateCarTechnicalVisit(Guid id, [FromBody] UpdateCarTechnicalVisitDto dto)
        {
            _logger.LogInformation("Updating technical visit information for car {CarId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateCarTechnicalVisitDto received for car {CarId}", id);
                return BadRequest(ModelState);
            }

            try
            {
                var existingCar = await _context.Set<Car>()
                    .FirstOrDefaultAsync(c => c.Id == id);

                if (existingCar == null)
                {
                    _logger.LogWarning("Car with Id {CarId} not found", id);
                    return NotFound(new { message = $"Car with Id '{id}' not found." });
                }

                // Check agency authorization
                if (!await _authService.HasAccessToAgencyAsync(existingCar.AgencyId))
                {
                    _logger.LogWarning("Unauthorized access attempt to car {CarId} from agency {AgencyId}", id, existingCar.AgencyId);
                    return Unauthorized();
                }

                // Validate dates if provided
                if (dto.TechnicalVisitStartDate.HasValue && dto.TechnicalVisitEndDate.HasValue)
                {
                    if (dto.TechnicalVisitStartDate.Value >= dto.TechnicalVisitEndDate.Value)
                    {
                        return BadRequest(new { message = "Technical visit start date must be before end date." });
                    }
                }

                // Update technical visit fields
                existingCar.TechnicalVisitStartDate = dto.TechnicalVisitStartDate.HasValue ? dto.TechnicalVisitStartDate.Value.ToUniversalTime() : dto.TechnicalVisitStartDate;
                existingCar.TechnicalVisitEndDate = dto.TechnicalVisitEndDate.HasValue ? dto.TechnicalVisitEndDate.Value.ToUniversalTime() : dto.TechnicalVisitEndDate;

                _context.Entry(existingCar).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated technical visit information for car {CarId}", id);

                return Ok(new { message = "Technical visit information updated successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating technical visit information for car {CarId}", id);
                return StatusCode(500, new { message = "An error occurred while updating technical visit information." });
            }
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
        public string Engine { get; set; }
        public string Gear { get; set; }
        public bool IsAvailable { get; set; }
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }
        public List<CarAttachmentDto>? Attachments { get; set; }

        public Car_Fields? Fields { get; set; }

        public int CurrentKM { get; set; }
        public DateTime? LastKmUpdate { get; set; }

        public List<Car_Details_Image_DTO>? Images { get; set; }

        // === Legal Documents ===
        // Assurance
        public string? AssuranceName { get; set; }
        public DateTime? AssuranceStartDate { get; set; }
        public DateTime? AssuranceEndDate { get; set; }
        // Technical Visit
        public DateTime? TechnicalVisitStartDate { get; set; }
        public DateTime? TechnicalVisitEndDate { get; set; }
    }

    public class Car_Details_Image_DTO
    {
        public string Path { get; set; }
        public bool IsMainImage { get; set; }
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
        public decimal DailyRate { get; set; }



        public Gear_type Gear_Type { get; set; }
        public Engine_Type Engine_Type { get; set; }

        public List<CarImageDTO>? Images { get; set; }

        public int CurrentKM { get; set; } = 0;

        // === Legal Documents ===
        // Assurance
        public string? AssuranceName { get; set; }
        public DateTime? AssuranceStartDate { get; set; }
        public DateTime? AssuranceEndDate { get; set; }
        // Technical Visit
        public DateTime? TechnicalVisitStartDate { get; set; }
        public DateTime? TechnicalVisitEndDate { get; set; }
    }

    public class CarImageDTO
    {
        public IFormFile Image { get; set; }
        public bool IsMain { get; set; }
    }

    public class UpdateCarDto
    {
        public Guid Id { get; set; }
        public Guid AgencyId { get; set; }

        // Identity/typing
        public string Car_ModelId { get; set; }
        public int Car_YearId { get; set; }

        // Basic
        public string LicensePlate { get; set; }
        public string Color { get; set; }

        // Availability/pricing/tracking
        public bool IsAvailable { get; set; }
        public string Status { get; set; }
        public decimal DailyRate { get; set; }
        public decimal? HourlyRate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }

        // Powertrain (aligning with CreateCarDto)
        public Gear_type Gear_Type { get; set; }
        public Engine_Type Engine_Type { get; set; }

        // Odometer
        public int? CurrentKM { get; set; }

        // Legal docs (optional full update here even though you have dedicated endpoints)
        public string? AssuranceName { get; set; }
        public DateTime? AssuranceStartDate { get; set; }
        public DateTime? AssuranceEndDate { get; set; }
        public DateTime? TechnicalVisitStartDate { get; set; }
        public DateTime? TechnicalVisitEndDate { get; set; }

        // Attachments behavior:
        // If true, existing attachments are wiped and replaced with the provided list.
        // If false or null, provided attachments are appended.
        public bool? AttachmentsReplace { get; set; }
        public List<CreateCarAttachmentDto>? Attachments { get; set; }
        public List<Guid>? AttachmentIdsToRemove { get; set; }

        // Images: add via files, remove by Id, and optionally set main
        public List<UpdateCarImageCreateDto>? ImagesToAdd { get; set; }
        public List<Guid>? ImageIdsToRemove { get; set; }

        // If provided, the image with this Id (or the last added with IsMain=true) becomes the only main image
        public Guid? MainImageId { get; set; }
    }

    // For adding images during update
    public class UpdateCarImageCreateDto
    {
        public IFormFile Image { get; set; }
        public bool IsMain { get; set; }
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

    /// <summary>
    /// DTO for updating car insurance information
    /// </summary>
    public class UpdateCarInsuranceDto
    {
        [StringLength(200)]
        public string? AssuranceName { get; set; }

        [DataType(DataType.Date)]
        public DateTime? AssuranceStartDate { get; set; }

        [DataType(DataType.Date)]
        public DateTime? AssuranceEndDate { get; set; }
    }

    /// <summary>
    /// DTO for updating car technical visit information
    /// </summary>
    public class UpdateCarTechnicalVisitDto
    {
        [DataType(DataType.Date)]
        public DateTime? TechnicalVisitStartDate { get; set; }

        [DataType(DataType.Date)]
        public DateTime? TechnicalVisitEndDate { get; set; }
    }
    #endregion
}
