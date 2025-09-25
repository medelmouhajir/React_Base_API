using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.GPS;
using React_Rentify.Server.Models.GPS.Records;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class GPSController : ControllerBase
    {
        private readonly GpsDbContext _context;
        private readonly MainDbContext _contextMain;
        private readonly ILogger<GPSController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public GPSController(GpsDbContext context, ILogger<GPSController> logger , IAgencyAuthorizationService authService, MainDbContext contextMain)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
            _contextMain = contextMain;
        }

        /// <summary>
        /// GET: api/GPS/devices
        /// Returns all GPS devices (DTO).
        /// </summary>
        [HttpGet("devices")]
        public async Task<IActionResult> GetAllDevices()
        {
            _logger.LogInformation("Retrieving all GPS devices");
            var devices = await _context.Set<Gps_Device>().ToListAsync();

            var dtoList = devices.Select(d => new GpsDeviceDto
            {
                Id = d.Id,
                DeviceSerialNumber = d.DeviceSerialNumber,
                Model = d.Model,
                InstallCarPlate = d.InstallCarPlate,
                InstalledOn = d.InstalledOn,
                DeactivatedOn = d.DeactivatedOn
            }).ToList();

            _logger.LogInformation("Retrieved {Count} GPS devices", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/GPS/devices/{serialNumber}
        /// Returns a single GPS device by its serial number (DTO).
        /// </summary>
        [HttpGet("devices/{serialNumber}")]
        public async Task<IActionResult> GetDeviceBySerial(string serialNumber)
        {
            _logger.LogInformation("Retrieving GPS device with SerialNumber {Serial}", serialNumber);
            var device = await _context.Set<Gps_Device>()
                .FirstOrDefaultAsync(d => d.DeviceSerialNumber == serialNumber);

            if (device == null)
            {
                _logger.LogWarning("GPS device with SerialNumber {Serial} not found", serialNumber);
                return NotFound(new { message = $"GPS device with SerialNumber '{serialNumber}' not found." });
            }

            var dto = new GpsDeviceDto
            {
                Id = device.Id,
                DeviceSerialNumber = device.DeviceSerialNumber,
                Model = device.Model,
                InstallCarPlate = device.InstallCarPlate,
                InstalledOn = device.InstalledOn,
                DeactivatedOn = device.DeactivatedOn
            };

            _logger.LogInformation("Retrieved GPS device {DeviceId}", device.Id);
            return Ok(dto);
        }

        /// <summary>
        /// POST: api/GPS/devices
        /// Adds a new GPS device. Accepts CreateGpsDeviceDto.
        /// </summary>
        [HttpPost("devices")]
        public async Task<IActionResult> AddDevice([FromBody] CreateGpsDeviceDto dto)
        {
            _logger.LogInformation("Adding new GPS device with SerialNumber {Serial}", dto.DeviceSerialNumber);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateGpsDeviceDto received");
                return BadRequest(ModelState);
            }

            // Ensure serial number is unique
            var exists = await _context.Set<Gps_Device>()
                .AnyAsync(d => d.DeviceSerialNumber == dto.DeviceSerialNumber);
            if (exists)
            {
                _logger.LogWarning("GPS device with SerialNumber {Serial} already exists", dto.DeviceSerialNumber);
                return Conflict(new { message = $"GPS device with SerialNumber '{dto.DeviceSerialNumber}' already exists." });
            }

            var device = new Gps_Device
            {
                Id = Guid.NewGuid(),
                DeviceSerialNumber = dto.DeviceSerialNumber,
                Model = dto.Model,
                InstallCarPlate = dto.InstallCarPlate,
                InstalledOn = dto.InstalledOn,
                DeactivatedOn = dto.DeactivatedOn
            };

            _context.Set<Gps_Device>().Add(device);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created GPS device {DeviceId}", device.Id);

            var resultDto = new GpsDeviceDto
            {
                Id = device.Id,
                DeviceSerialNumber = device.DeviceSerialNumber,
                Model = device.Model,
                InstallCarPlate = device.InstallCarPlate,
                InstalledOn = device.InstalledOn,
                DeactivatedOn = device.DeactivatedOn
            };

            return CreatedAtAction(nameof(GetDeviceBySerial), new { serialNumber = device.DeviceSerialNumber }, resultDto);
        }

        /// <summary>
        /// GET: api/GPS/records
        /// Returns all location records (DTO).
        /// </summary>
        [HttpGet("records")]
        public async Task<IActionResult> GetAllRecords()
        {
            _logger.LogInformation("Retrieving all GPS location records");
            var records = await _context.Set<Location_Record>()
                .Include(r => r.Gps_Device)
                .ToListAsync();

            var dtoList = records.Select(r => new LocationRecordDto
            {
                Id = r.Id,
                Gps_DeviceId = r.Gps_DeviceId,
                DeviceSerialNumber = r.DeviceSerialNumber,
                Timestamp = r.Timestamp,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                SpeedKmh = r.SpeedKmh,
                Heading = r.Heading,
                Altitude = r.Altitude,
                IgnitionOn = r.IgnitionOn,
                StatusFlags = r.StatusFlags
            }).ToList();

            _logger.LogInformation("Retrieved {Count} location records", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/GPS/records/device/{serialNumber}
        /// Returns all location records for a given device serial number (DTO).
        /// </summary>
        [HttpGet("records/device/{serialNumber}")]
        public async Task<IActionResult> GetRecordsByDeviceSerial(string serialNumber)
        {
            _logger.LogInformation("Retrieving location records for device {Serial}", serialNumber);

            var device = await _context.Set<Gps_Device>()
                .FirstOrDefaultAsync(d => d.DeviceSerialNumber == serialNumber);
            if (device == null)
            {
                _logger.LogWarning("GPS device with SerialNumber {Serial} not found", serialNumber);
                return NotFound(new { message = $"GPS device with SerialNumber '{serialNumber}' not found." });
            }

            var records = await _context.Set<Location_Record>()
                .Where(r => r.DeviceSerialNumber == serialNumber)
                .ToListAsync();

            var dtoList = records.Select(r => new LocationRecordDto
            {
                Id = r.Id,
                Gps_DeviceId = r.Gps_DeviceId,
                DeviceSerialNumber = r.DeviceSerialNumber,
                Timestamp = r.Timestamp,
                Latitude = r.Latitude,
                Longitude = r.Longitude,
                SpeedKmh = r.SpeedKmh,
                Heading = r.Heading,
                Altitude = r.Altitude,
                IgnitionOn = r.IgnitionOn,
                StatusFlags = r.StatusFlags
            }).ToList();

            _logger.LogInformation("Retrieved {Count} records for device {Serial}", dtoList.Count, serialNumber);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/GPS/records/latest/{serialNumber}
        /// Returns the latest location record for a given device serial number (DTO).
        /// </summary>
        [HttpGet("records/latest/{serialNumber}")]
        public async Task<IActionResult> GetLatestRecordBySerial(string serialNumber)
        {
            _logger.LogInformation("Retrieving latest location record for device {Serial}", serialNumber);

            var record = await _context.Set<Location_Record>()
                .Where(r => r.DeviceSerialNumber == serialNumber)
                .OrderByDescending(r => r.Timestamp)
                .FirstOrDefaultAsync();

            if (record == null)
            {
                _logger.LogWarning("No records found for device {Serial}", serialNumber);
                return NotFound(new { message = $"No location records found for device '{serialNumber}'." });
            }

            var dto = new LocationRecordDto
            {
                Id = record.Id,
                Gps_DeviceId = record.Gps_DeviceId,
                DeviceSerialNumber = record.DeviceSerialNumber,
                Timestamp = record.Timestamp,
                Latitude = record.Latitude,
                Longitude = record.Longitude,
                SpeedKmh = record.SpeedKmh,
                Heading = record.Heading,
                Altitude = record.Altitude,
                IgnitionOn = record.IgnitionOn,
                StatusFlags = record.StatusFlags
            };

            _logger.LogInformation("Retrieved latest record {RecordId} for device {Serial}", dto.Id, serialNumber);
            return Ok(dto);
        }


        /// <summary>
        /// PUT: api/GPS/cars/{carId}
        /// Updates GPS settings for a specific car (deviceSerialNumber and isTrackingActive)
        /// </summary>
        [HttpPut("cars/{carId:guid}")]
        public async Task<IActionResult> UpdateCarGps(Guid carId, [FromBody] UpdateCarGpsDto dto)
        {
            _logger.LogInformation("Updating GPS settings for car {CarId}", carId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateCarGpsDto received for car {CarId}", carId);
                return BadRequest(ModelState);
            }

            try
            {

                var car = await _contextMain.Cars
                    .Include(x=> x.Car_Model)
                    .FirstOrDefaultAsync(c => c.Id == carId);

                if (car == null)
                {
                    _logger.LogWarning("Car with ID {CarId} not found", carId);
                    return NotFound(new { message = $"Car with ID '{carId}' not found." });
                }

                // Check if user has access to this car's agency (if needed)
                var hasAccess = await _authService.HasAccessToAgencyAsync(car.AgencyId);
                if (!hasAccess)
                {
                    _logger.LogWarning("User does not have access to car {CarId} in agency {AgencyId}", carId, car.AgencyId);
                    return Forbid();
                }

                // Update car GPS settings
                car.DeviceSerialNumber = string.IsNullOrWhiteSpace(dto.DeviceSerialNumber) ? null : dto.DeviceSerialNumber.Trim();
                car.IsTrackingActive = dto.IsTrackingActive && !string.IsNullOrWhiteSpace(car.DeviceSerialNumber);

                await _contextMain.SaveChangesAsync();

                _logger.LogInformation("Successfully updated GPS settings for car {CarId}. Device: {Device}, Tracking: {Tracking}",
                    carId, car.DeviceSerialNumber ?? "None", car.IsTrackingActive);

                // Return updated car info
                var result = new CarGpsDto
                {
                    Id = car.Id,
                    Model = car.Car_Model.Name,
                    LicensePlate = car.LicensePlate,
                    DeviceSerialNumber = car.DeviceSerialNumber,
                    IsTrackingActive = car.IsTrackingActive
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating GPS settings for car {CarId}", carId);
                return StatusCode(500, new { message = "An error occurred while updating GPS settings." });
            }
        }


        /// <summary>
        /// GET: api/GPS/cars/agency/{agencyId}
        /// Gets all cars with their GPS status for a specific agency
        /// </summary>
        [HttpGet("cars/agency/{agencyId:guid}")]
        public async Task<IActionResult> GetCarsByAgencyWithGpsStatus(Guid agencyId)
        {
            _logger.LogInformation("Retrieving cars with GPS status for agency {AgencyId}", agencyId);

            try
            {
                // Check if user has access to this agency
                var hasAccess = await _authService.HasAccessToAgencyAsync(agencyId);
                if (!hasAccess)
                {
                    _logger.LogWarning("User does not have access to agency {AgencyId}", agencyId);
                    return Forbid();
                }

                var cars = await _contextMain.Cars
                    .Include(x=> x.Car_Model)
                    .Where(c => c.AgencyId == agencyId)
                    .Select(c => new CarGpsDto
                    {
                        Id = c.Id,
                        Model = c.Car_Model.Name,
                        LicensePlate = c.LicensePlate,
                        DeviceSerialNumber = c.DeviceSerialNumber,
                        IsTrackingActive = c.IsTrackingActive
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} cars for agency {AgencyId}", cars.Count, agencyId);
                return Ok(cars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cars for agency {AgencyId}", agencyId);
                return StatusCode(500, new { message = "An error occurred while retrieving cars." });
            }
        }
    }

    #region DTOs

    public class GpsDeviceDto
    {
        public Guid Id { get; set; }
        public string DeviceSerialNumber { get; set; }
        public string Model { get; set; }
        public string InstallCarPlate { get; set; }
        public DateTime InstalledOn { get; set; }
        public DateTime? DeactivatedOn { get; set; }
    }

    public class CreateGpsDeviceDto
    {
        public string DeviceSerialNumber { get; set; }
        public string Model { get; set; }
        public string InstallCarPlate { get; set; }
        public DateTime InstalledOn { get; set; }
        public DateTime? DeactivatedOn { get; set; }
    }

    public class LocationRecordDto
    {
        public Guid Id { get; set; }
        public Guid Gps_DeviceId { get; set; }
        public string DeviceSerialNumber { get; set; }
        public DateTime Timestamp { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double SpeedKmh { get; set; }
        public double? Heading { get; set; }
        public double? Altitude { get; set; }
        public bool? IgnitionOn { get; set; }
        public string StatusFlags { get; set; }
    }

    public class UpdateCarGpsDto
    {
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }
    }

    public class CarGpsDto
    {
        public Guid Id { get; set; }
        public string Model { get; set; }
        public string LicensePlate { get; set; }
        public string? DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }
    }
    #endregion
}
