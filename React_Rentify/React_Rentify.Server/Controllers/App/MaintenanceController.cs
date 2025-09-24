using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Maintenances;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MaintenanceController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<MaintenanceController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public MaintenanceController(MainDbContext context, ILogger<MaintenanceController> logger, IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Maintenance
        /// Returns all maintenance records (DTO), including basic car info.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllMaintenances()
        {
            _logger.LogInformation("Retrieving all maintenance records");
            var records = await _context.Set<Maintenance_Record>()
                .Include(m => m.Car)
                .ToListAsync();

            var dtoList = records.Select(m => new MaintenanceDto
            {
                Id = m.Id,
                CarId = m.CarId,
                ScheduledDate = m.ScheduledDate,
                Description = m.Description,
                Cost = m.Cost,
                IsCompleted = m.IsCompleted,
                CompletedDate = m.CompletedDate,
                Remarks = m.Remarks,
                CarLicensePlate = m.Car != null ? m.Car.LicensePlate : null
            })
            .ToList();

            _logger.LogInformation("Retrieved {Count} maintenance records", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Maintenance/{id}
        /// Returns a single maintenance record by Id (DTO), including basic car info.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetMaintenanceById(Guid id)
        {
            _logger.LogInformation("Retrieving maintenance record with Id {RecordId}", id);
            var record = await _context.Set<Maintenance_Record>()
                .Include(m => m.Car)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
            {
                _logger.LogWarning("Maintenance record with Id {RecordId} not found", id);
                return NotFound(new { message = $"Maintenance record with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(record.Car.AgencyId))
                return Unauthorized();

            var dto = new MaintenanceDto
            {
                Id = record.Id,
                CarId = record.CarId,
                ScheduledDate = record.ScheduledDate,
                Description = record.Description,
                Cost = record.Cost,
                IsCompleted = record.IsCompleted,
                CompletedDate = record.CompletedDate,
                Remarks = record.Remarks,
                CarLicensePlate = record.Car != null ? record.Car.LicensePlate : null
            };

            _logger.LogInformation("Retrieved maintenance record {RecordId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Maintenance/car/{carId}
        /// Returns all maintenance records for a given car (DTO).
        /// </summary>
        [HttpGet("car/{carId:guid}")]
        public async Task<IActionResult> GetMaintenancesByCarId(Guid carId)
        {
            _logger.LogInformation("Retrieving maintenance records for Car {CarId}", carId);

            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();

            var records = await _context.Set<Maintenance_Record>()
                .Where(m => m.CarId == carId)
                .ToListAsync();

            var dtoList = records.Select(m => new MaintenanceDto
            {
                Id = m.Id,
                CarId = m.CarId,
                ScheduledDate = m.ScheduledDate,
                Description = m.Description,
                Cost = m.Cost,
                IsCompleted = m.IsCompleted,
                CompletedDate = m.CompletedDate,
                Remarks = m.Remarks,
                CarLicensePlate = null // Since we already know CarId, license plate isn’t needed here
            })
            .ToList();

            _logger.LogInformation("Retrieved {Count} maintenance records for Car {CarId}", dtoList.Count, carId);
            return Ok(dtoList);
        }
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetMaintenancesByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving maintenance records for Car {agencyId}", agencyId);

            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var records = await _context.Set<Maintenance_Record>()
                .Include(x=> x.Car)
                .Where(m => m.Car.AgencyId == agencyId)
                .ToListAsync();

            var dtoList = records.Select(m => new MaintenanceDto
            {
                Id = m.Id,
                CarId = m.CarId,
                ScheduledDate = m.ScheduledDate,
                Description = m.Description,
                Cost = m.Cost,
                IsCompleted = m.IsCompleted,
                CompletedDate = m.CompletedDate,
                Remarks = m.Remarks,
                CarLicensePlate = null // Since we already know CarId, license plate isn’t needed here
            })
            .ToList();

            _logger.LogInformation("Retrieved {Count} maintenance records for agency {agencyId}", dtoList.Count, agencyId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Maintenance
        /// Creates a new maintenance record. Accepts CreateMaintenanceDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateMaintenance([FromBody] CreateMaintenanceDto dto)
        {
            _logger.LogInformation("Creating new maintenance record for Car {CarId}", dto.CarId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateMaintenanceDto received");
                return BadRequest(ModelState);
            }

            // Verify Car exists
            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == dto.CarId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
            }


            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();

            var record = new Maintenance_Record
            {
                Id = Guid.NewGuid(),
                CarId = dto.CarId,
                ScheduledDate = dto.ScheduledDate.ToUniversalTime(),
                Description = dto.Description,
                Cost = dto.Cost,
                IsCompleted = dto.IsCompleted,
                CompletedDate = dto.CompletedDate.HasValue ? dto.CompletedDate.Value.ToUniversalTime() : dto.CompletedDate,
                Remarks = dto.Remarks
            };

            try
            {
                _context.Set<Maintenance_Record>().Add(record);
                if( ! record.IsCompleted && record.ScheduledDate.Date <= DateTime.UtcNow.Date)
                {
                    carExists.Status = "Maintenance";
                    _context.Set<Car>().Update(carExists);
                }else if( record.IsCompleted && carExists.Status == "Maintenance")
                {
                    carExists.Status = "Available";
                    _context.Set<Car>().Update(carExists);
                }
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                return BadRequest();
            }


            _logger.LogInformation("Created maintenance record {RecordId}", record.Id);

            var resultDto = new MaintenanceDto
            {
                Id = record.Id,
                CarId = record.CarId,
                ScheduledDate = record.ScheduledDate,
                Description = record.Description,
                Cost = record.Cost,
                IsCompleted = record.IsCompleted,
                CompletedDate = record.CompletedDate,
                Remarks = record.Remarks,
                CarLicensePlate = null
            };

            return CreatedAtAction(nameof(GetMaintenanceById), new { id = record.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Maintenance/{id}
        /// Updates an existing maintenance record. Accepts UpdateMaintenanceDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateMaintenance(Guid id, [FromBody] UpdateMaintenanceDto dto)
        {
            _logger.LogInformation("Updating maintenance record {RecordId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateMaintenanceDto for Record {RecordId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existingRecord = await _context.Set<Maintenance_Record>()
                .Include(x=> x.Car)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (existingRecord == null)
            {
                _logger.LogWarning("Maintenance record with Id {RecordId} not found", id);
                return NotFound(new { message = $"Maintenance record with Id '{id}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(existingRecord.Car.AgencyId))
                return Unauthorized();

            // If Car was changed, verify new Car
            if (existingRecord.CarId != dto.CarId)
            {
                var carExists = await _context.Set<Car>().AnyAsync(c => c.Id == dto.CarId);
                if (!carExists)
                {
                    _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                    return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
                }
            }

            // Update scalar properties
            existingRecord.CarId = dto.CarId;
            existingRecord.ScheduledDate = dto.ScheduledDate;
            existingRecord.Description = dto.Description;
            existingRecord.Cost = dto.Cost;
            existingRecord.IsCompleted = dto.IsCompleted;
            existingRecord.CompletedDate = dto.CompletedDate;
            existingRecord.Remarks = dto.Remarks;

            _context.Entry(existingRecord).State = EntityState.Modified;
            if (existingRecord.IsCompleted && existingRecord.Car.Status == "Maintenance")
            {
                existingRecord.Car.Status = "Available";
                _context.Set<Car>().Update(existingRecord.Car);
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated maintenance record {RecordId}", id);

            var resultDto = new MaintenanceDto
            {
                Id = existingRecord.Id,
                CarId = existingRecord.CarId,
                ScheduledDate = existingRecord.ScheduledDate,
                Description = existingRecord.Description,
                Cost = existingRecord.Cost,
                IsCompleted = existingRecord.IsCompleted,
                CompletedDate = existingRecord.CompletedDate,
                Remarks = existingRecord.Remarks,
                CarLicensePlate = null
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/Maintenance/{id}
        /// Deletes a maintenance record.
        /// </summary>
        [Authorize(Roles = "Owner")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteMaintenance(Guid id)
        {
            _logger.LogInformation("Deleting maintenance record {RecordId}", id);

            var record = await _context.Set<Maintenance_Record>()
                .Include(x=> x.Car)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (record == null)
            {
                _logger.LogWarning("Maintenance record with Id {RecordId} not found", id);
                return NotFound(new { message = $"Maintenance record with Id '{id}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(record.Car.AgencyId))
                return Unauthorized();

            _context.Set<Maintenance_Record>().Remove(record);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted maintenance record {RecordId}", id);
            return NoContent();
        }
    }

    #region DTOs

    public class MaintenanceDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Description { get; set; }
        public decimal? Cost { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Remarks { get; set; }

        /// <summary>
        /// Optional: license plate of the car for quick reference
        /// </summary>
        public string? CarLicensePlate { get; set; }
    }

    public class CreateMaintenanceDto
    {
        public Guid CarId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Description { get; set; }
        public decimal? Cost { get; set; }
        public bool IsCompleted { get; set; } = false;
        public DateTime? CompletedDate { get; set; }
        public string Remarks { get; set; }
    }

    public class UpdateMaintenanceDto
    {
        public Guid Id { get; set; }
        public Guid CarId { get; set; }
        public DateTime ScheduledDate { get; set; }
        public string Description { get; set; }
        public decimal? Cost { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedDate { get; set; }
        public string Remarks { get; set; }
    }

    #endregion
}
