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

        public GPSController(GpsDbContext context, ILogger<GPSController> logger, IAgencyAuthorizationService authService, MainDbContext contextMain)
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

        [HttpGet("records/car/{carId}")]
        public async Task<IActionResult> GetRecordsByCarAndDates(Guid carId , [FromQuery] DateTime StartDate, [FromQuery] DateTime EndDate)
        {
            _logger.LogInformation("Retrieving location records for car {carId}", carId);

            var car = await _contextMain.Cars.FirstOrDefaultAsync(x=> x.Id == carId);

            if (car == null)
                return Ok(new NotFoundResult());

            var device = await _context.Set<Gps_Device>()
                .FirstOrDefaultAsync(d => d.DeviceSerialNumber == car.DeviceSerialNumber);
            if (device == null)
            {
                _logger.LogWarning("GPS device with SerialNumber {Serial} not found", car.DeviceSerialNumber);
                return NotFound(new { message = $"GPS device with SerialNumber '{car.DeviceSerialNumber}' not found." });
            }

            var records = await _context.Set<Location_Record>()
                .Where(r => r.DeviceSerialNumber == device.DeviceSerialNumber )
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

            _logger.LogInformation("Retrieved {Count} records for device {Serial}", dtoList.Count, car.DeviceSerialNumber);
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
                    .Include(x => x.Car_Model)
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
                    .Include(x => x.Car_Model)
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

        [Authorize(Roles = "Admin")]
        [HttpGet("cars/all")]
        public async Task<IActionResult> GetCarsWithGpsStatus()
        {
            _logger.LogInformation("Retrieving cars with GPS status for all agencies");

            try
            {
                var cars = await _contextMain.Cars
                    .Include(x => x.Car_Model)
                    .Select(c => new CarGpsDto
                    {
                        Id = c.Id,
                        Model = c.Car_Model.Name,
                        LicensePlate = c.LicensePlate,
                        DeviceSerialNumber = c.DeviceSerialNumber,
                        IsTrackingActive = c.IsTrackingActive
                    })
                    .ToListAsync();

                _logger.LogInformation("Retrieved {Count} cars for all agencies", cars.Count);
                return Ok(cars);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving cars for all agencies");
                return StatusCode(500, new { message = "An error occurred while retrieving cars." });
            }
        }


        /// <summary>
        /// GET: api/GPS/vehicles/{vehicleId}/latest
        /// Returns the latest GPS position for a specific vehicle (DTO).
        /// </summary>
        [HttpGet("vehicles/{vehicleId}/latest")]
        public async Task<IActionResult> GetVehicleLatestPosition(Guid vehicleId)
        {
            _logger.LogInformation("Retrieving latest position for vehicle {VehicleId}", vehicleId);

            try
            {
                // Get the car and check authorization
                var car = await _contextMain.Set<Car>()
                    .Include(c => c.Car_Model)
                    .FirstOrDefaultAsync(c => c.Id == vehicleId);

                if (car == null)
                {
                    _logger.LogWarning("Vehicle {VehicleId} not found", vehicleId);
                    return NotFound(new { message = $"Vehicle with ID '{vehicleId}' not found." });
                }

                var hasAccess = await _authService.HasAccessToAgencyAsync(car.AgencyId);
                if (!hasAccess)
                {
                    _logger.LogWarning("User does not have access to vehicle {VehicleId}", vehicleId);
                    return Forbid();
                }

                if (string.IsNullOrEmpty(car.DeviceSerialNumber))
                {
                    _logger.LogWarning("Vehicle {VehicleId} has no GPS device assigned", vehicleId);
                    return BadRequest(new { message = "This vehicle has no GPS device assigned." });
                }

                // Get the latest record
                var latestRecord = await _context.Set<Location_Record>()
                    .Where(r => r.DeviceSerialNumber == car.DeviceSerialNumber)
                    .OrderByDescending(r => r.Timestamp)
                    .FirstOrDefaultAsync();

                if (latestRecord == null)
                {
                    _logger.LogWarning("No GPS records found for vehicle {VehicleId}", vehicleId);
                    return NotFound(new { message = "No GPS data found for this vehicle." });
                }

                var result = new VehicleLatestPositionDto
                {
                    VehicleId = vehicleId,
                    Model = car.Car_Model.Name,
                    LicensePlate = car.LicensePlate,
                    DeviceSerialNumber = car.DeviceSerialNumber,
                    LastRecord = new LatestLocationDto
                    {
                        Timestamp = latestRecord.Timestamp,
                        Latitude = latestRecord.Latitude,
                        Longitude = latestRecord.Longitude,
                        SpeedKmh = latestRecord.SpeedKmh,
                        Heading = latestRecord.Heading,
                        Altitude = latestRecord.Altitude,
                        IgnitionOn = latestRecord.IgnitionOn,
                        StatusFlags = latestRecord.StatusFlags
                    },
                    IsOnline = (DateTime.UtcNow - latestRecord.Timestamp).TotalMinutes < 5,
                    LastUpdateMinutesAgo = (int)(DateTime.UtcNow - latestRecord.Timestamp).TotalMinutes
                };

                _logger.LogInformation("Retrieved latest position for vehicle {VehicleId}", vehicleId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving latest position for vehicle {VehicleId}", vehicleId);
                return StatusCode(500, new { message = "An error occurred while retrieving vehicle position." });
            }
        }

        /// <summary>
        /// GET: api/GPS/agency/{agencyId}/vehicles
        /// Returns all vehicles with GPS data for a specific agency (DTO).
        /// </summary>
        [HttpGet("agency/{agencyId}/vehicles")]
        public async Task<IActionResult> GetAgencyVehicles(Guid agencyId)
        {
            _logger.LogInformation("Retrieving vehicles with GPS data for agency {AgencyId}", agencyId);

            try
            {
                // 1) Auth
                var hasAccess = await _authService.HasAccessToAgencyAsync(agencyId);
                if (!hasAccess)
                {
                    _logger.LogWarning("User does not have access to agency {AgencyId}", agencyId);
                    return Forbid();
                }

                // 2) Fetch cars from MAIN DB (single context)
                var cars = await _contextMain.Set<Car>()
                    .AsNoTracking()
                    .Where(c => c.AgencyId == agencyId)
                    .Select(c => new
                    {
                        c.Id,
                        Model = c.Car_Model.Name,     // keep Include out; projection handles it
                        c.LicensePlate,
                        c.DeviceSerialNumber,
                        c.IsTrackingActive
                    })
                    .ToListAsync();

                // 3) Collect device serials to look up in GPS DB
                var serials = cars
                    .Select(c => c.DeviceSerialNumber)
                    .Where(s => !string.IsNullOrWhiteSpace(s))
                    .Distinct()
                    .ToList();

                // 4) Fetch latest record per device from GPS DB (second context)
                //    NOTE: group + First() is translated; OrderByDescending + First() picks latest
                var latestRecords = await _context.Set<Location_Record>()   // <- your GPS context
                    .AsNoTracking()
                    .Where(r => serials.Contains(r.DeviceSerialNumber))
                    .GroupBy(r => r.DeviceSerialNumber)
                    .Select(g => g.OrderByDescending(r => r.Timestamp).First())
                    .ToListAsync();

                // 5) Build lookup for quick join in memory
                var latestBySerial = latestRecords.ToDictionary(
                    r => r.DeviceSerialNumber,
                    r => new LatestLocationDto
                    {
                        Timestamp = r.Timestamp,
                        Latitude = r.Latitude,
                        Longitude = r.Longitude,
                        SpeedKmh = r.SpeedKmh,
                        Heading = r.Heading,
                        IgnitionOn = r.IgnitionOn,
                        StatusFlags = r.StatusFlags
                    });

                // 6) Final DTOs
                var vehicles = cars.Select(c => new AgencyVehicleDto
                {
                    Id = c.Id,
                    Model = c.Model,
                    LicensePlate = c.LicensePlate,
                    DeviceSerialNumber = c.DeviceSerialNumber,
                    IsTrackingActive = c.IsTrackingActive,
                    LastRecord = (c.DeviceSerialNumber != null && latestBySerial.TryGetValue(c.DeviceSerialNumber, out var dto))
                        ? dto
                        : null
                }).ToList();

                _logger.LogInformation("Retrieved {Count} vehicles for agency {AgencyId}", vehicles.Count, agencyId);
                return Ok(vehicles);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicles for agency {AgencyId}", agencyId);
                return StatusCode(500, new { message = "An error occurred while retrieving vehicles." });
            }
        }

    }


    internal class AgencyVehicleDto
    {
        public Guid Id { get; set; }
        public string Model { get; set; }
        public string LicensePlate { get; set; }
        public string DeviceSerialNumber { get; set; }
        public bool IsTrackingActive { get; set; }
        public LatestLocationDto LastRecord { get; set; }
    }

    internal class VehicleLatestPositionDto
    {
        public Guid VehicleId { get; set; }
        public string Model { get; set; }
        public string LicensePlate { get; set; }
        public string DeviceSerialNumber { get; set; }
        public LatestLocationDto LastRecord { get; set; }
        public bool IsOnline { get; set; }
        public int LastUpdateMinutesAgo { get; set; }
    }

    internal class LatestLocationDto
    {
        public DateTime Timestamp { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double SpeedKmh { get; set; }
        public double? Heading { get; set; }
        public double? Altitude { get; set; }
        public bool? IgnitionOn { get; set; }
        public string StatusFlags { get; set; }
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
