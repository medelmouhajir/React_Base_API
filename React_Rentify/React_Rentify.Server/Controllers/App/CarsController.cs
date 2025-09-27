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
                HourlyRate = dto.HourlyRate,
                IsTrackingActive = false,
                Car_Attachments = new List<Car_Attachment>(),
                Gear_Type = dto.Gear_Type,
                Engine_Type = dto.Engine_Type,
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

            if (!await _authService.HasAccessToAgencyAsync(existingCar.AgencyId))
                return Unauthorized();

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


            return Ok();
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

        public int CurrentKM { get; set; }
        public DateTime? LastKmUpdate { get; set; }

        public List<Car_Details_Image_DTO>? Images { get; set; }
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
        public decimal? HourlyRate { get; set; }


        public Gear_type Gear_Type { get; set; }
        public Engine_Type Engine_Type { get; set; }

        public List<CarImageDTO>? Images { get; set; }
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
