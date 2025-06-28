using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Invoices;
using React_Rentify.Server.Models.Reservations;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ReservationsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<ReservationsController> _logger;

        public ReservationsController(MainDbContext context, ILogger<ReservationsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/Reservations
        /// Returns all reservations (DTO), including related Agency, Car, Customer, and Invoice info.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllReservations()
        {
            _logger.LogInformation("Retrieving all reservations");
            var reservations = await _context.Set<Reservation>()
                .Include(r => r.Agency)
                .Include(r => r.Car)
                .Include(r => r.Reservation_Customers)
                .Include(r => r.Invoice)
                .ToListAsync();

            var dtoList = reservations.Select(r => MapToDto(r)).ToList();

            _logger.LogInformation("Retrieved {Count} reservations", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Reservations/{id}
        /// Returns a single reservation by Id (DTO), including related Agency, Car, Customer, and Invoice info.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetReservationById(Guid id)
        {
            _logger.LogInformation("Retrieving reservation with Id {ReservationId}", id);
            try
            {
                var reservation = await _context.Set<Reservation>()
                    .Include(r => r.Agency)
                    .Include(r => r.Car)
                    .ThenInclude(x => x.Car_Model)
                    .ThenInclude(x => x.Manufacturer)
                    .Include(r => r.Reservation_Customers)
                    .ThenInclude(x => x.Customer)
                    .Include(r => r.Invoice)
                    .Where(x => x.Id == id)
                    .Select(x => new
                    {
                        AgencyId = id,
                        CarId = x.CarId,
                        ActualStartTime = x.ActualStartTime,
                        ActualEndTime = x.ActualEndTime,
                        DropoffLocation = x.DropoffLocation,
                        AgreedPrice = x.AgreedPrice,
                        EndDate = x.EndDate,
                        FinalPrice = x.FinalPrice,
                        FuelLevelEnd = x.FuelLevelEnd,
                        FuelLevelStart = x.FuelLevelStart,
                        OdometerEnd = x.OdometerEnd,
                        OdometerStart = x.OdometerStart,
                        PickupLocation = x.PickupLocation,
                        StartDate = x.StartDate,
                        Status = x.Status,
                        Agency = new Agency
                        {
                            Id = x.Agency.Id,
                            Name = x.Agency.Name,
                            Address = x.Agency.Address,
                            Email = x.Agency.Email,
                            LogoUrl = x.Agency.LogoUrl,
                            PhoneOne = x.Agency.PhoneOne,
                            PhoneTwo = x.Agency.PhoneTwo
                        },
                        Customers = x.Reservation_Customers.Select(c =>
                            new Customer
                            {
                                Id = c.CustomerId,
                                FullName = c.Customer.FullName,
                                PhoneNumber = c.Customer.PhoneNumber,
                                LicenseNumber = c.Customer.LicenseNumber,
                                DateOfBirth = c.Customer.DateOfBirth,
                                Address = c.Customer.Address,
                                NationalId = c.Customer.NationalId,
                                PassportId = c.Customer.PassportId,
                                Email = c.Customer.Email,
                            }
                        ),
                        Car = new Car
                        {
                            Id = x.CarId,
                            LicensePlate = x.Car.LicensePlate,
                            Car_Model = new Models.Filters.Cars.Car_Model
                            {
                                Id = x.Car.Car_ModelId,
                                Name = x.Car.Car_Model.Name,
                                Manufacturer = new Models.Filters.Cars.Manufacturer
                                {
                                    Id = x.Car.Car_Model.ManufacturerId,
                                    Name = x.Car.Car_Model.Manufacturer.Name
                                }
                            }
                        }
                    })
                    .FirstOrDefaultAsync();

                if (reservation == null)
                {
                    _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                    return NotFound(new { message = $"Reservation with Id '{id}' not found." });
                }

                _logger.LogInformation("Retrieved reservation {ReservationId}", id);
                return Ok(reservation);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// GET: api/Reservations/agency/{agencyId}
        /// Returns all reservations for a given agency (DTO), including related entities.
        /// </summary>
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetReservationsByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving reservations for Agency {AgencyId}", agencyId);

            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == agencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' does not exist." });
            }

            try
            {
                var reservations = await _context.Set<Reservation>()
                    .Where(r => r.AgencyId == agencyId)
                    .Include(r => r.Car)
                    .Include(r => r.Reservation_Customers)
                    .Include(r => r.Invoice)
                    .ToListAsync();

                var dtoList = reservations.Select(r => MapToDto(r)).ToList();
                _logger.LogInformation("Retrieved {Count} reservations for Agency {AgencyId}", dtoList.Count, agencyId);
                return Ok(dtoList);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// GET: api/Reservations/customer/{customerId}
        /// Returns all reservations for a given customer (DTO), including related entities.
        /// </summary>
        [HttpGet("customer/{customerId:guid}")]
        public async Task<IActionResult> GetReservationsByCustomerId(Guid customerId)
        {
            _logger.LogInformation("Retrieving reservations for Customer {CustomerId}", customerId);

            var customerExists = await _context.Set<Customer>()
                .AnyAsync(c => c.Id == customerId);
            if (!customerExists)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", customerId);
                return NotFound(new { message = $"Customer with Id '{customerId}' does not exist." });
            }

            var reservations = await _context.Set<Reservation>()
                .Where(r => r.Reservation_Customers.Any(x => x.CustomerId == customerId))
                .Include(r => r.Agency)
                .Include(r => r.Car)
                .Include(r => r.Invoice)
                .ToListAsync();

            var dtoList = reservations.Select(r => MapToDto(r)).ToList();
            _logger.LogInformation("Retrieved {Count} reservations for Customer {CustomerId}", dtoList.Count, customerId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Reservations
        /// Creates a new reservation. Accepts CreateReservationDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationDto dto)
        {
            _logger.LogInformation("Creating new reservation for Agency {AgencyId}, with {CustomerCount} customers",
                dto.AgencyId, dto.CustomersId.Count);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateReservationDto received");
                return BadRequest(ModelState);
            }

            // Verify Agency exists
            var agencyExists = await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId);
            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
            }

            // Verify Car exists
            var carExists = await _context.Set<Car>().AnyAsync(c => c.Id == dto.CarId);
            if (!carExists)
            {
                _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
            }

            // Verify all Customers exist
            if (dto.CustomersId.Count == 0)
            {
                _logger.LogWarning("No customers provided for reservation");
                return BadRequest(new { message = "At least one customer must be provided for the reservation." });
            }

            foreach (var customerId in dto.CustomersId)
            {
                var customerExists = await _context.Set<Customer>().AnyAsync(c => c.Id == customerId);
                if (!customerExists)
                {
                    _logger.LogWarning("Customer with Id {CustomerId} does not exist", customerId);
                    return BadRequest(new { message = $"Customer with Id '{customerId}' does not exist." });
                }
            }

            var reservation = new Reservation
            {
                Id = Guid.NewGuid(),
                AgencyId = dto.AgencyId,
                CarId = dto.CarId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = dto.Status ?? "Reserved",
                AgreedPrice = dto.AgreedPrice,
                PickupLocation = dto.PickupLocation,
                DropoffLocation = dto.DropoffLocation
            };

            _context.Set<Reservation>().Add(reservation);

            // Add all customers to the reservation
            foreach (var customerId in dto.CustomersId)
            {
                _context.Set<Reservation_Customer>().Add(new Reservation_Customer
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customerId,
                    ReservationId = reservation.Id,
                    Date_Added = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Created reservation {ReservationId} with {CustomerCount} customers",
                reservation.Id, dto.CustomersId.Count);

            var resultDto = MapToDto(reservation);
            return CreatedAtAction(nameof(GetReservationById), new { id = reservation.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Reservations/{id}
        /// Updates an existing reservation. Accepts UpdateReservationDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateReservation(Guid id, [FromBody] UpdateReservationDto dto)
        {
            _logger.LogInformation("Updating reservation {ReservationId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateReservationDto for Reservation {ReservationId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existing = await _context.Set<Reservation>()
                .Include(r => r.Invoice)
                .Include(r => r.Reservation_Customers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (existing == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            // If Agency changed, verify it
            if (existing.AgencyId != dto.AgencyId)
            {
                var agencyExistsUpdate = await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId);
                if (!agencyExistsUpdate)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
                }
            }

            // If Car changed, verify it
            if (existing.CarId != dto.CarId)
            {
                var carExistsUpdate = await _context.Set<Car>().AnyAsync(c => c.Id == dto.CarId);
                if (!carExistsUpdate)
                {
                    _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                    return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
                }
            }

            // Verify all customers exist
            if (dto.CustomersId.Count == 0)
            {
                _logger.LogWarning("No customers provided for reservation update");
                return BadRequest(new { message = "At least one customer must be provided for the reservation." });
            }

            foreach (var customerId in dto.CustomersId)
            {
                var customerExistsUpdate = await _context.Set<Customer>().AnyAsync(c => c.Id == customerId);
                if (!customerExistsUpdate)
                {
                    _logger.LogWarning("Customer with Id {CustomerId} does not exist", customerId);
                    return BadRequest(new { message = $"Customer with Id '{customerId}' does not exist." });
                }
            }

            // Update scalar properties
            existing.AgencyId = dto.AgencyId;
            existing.CarId = dto.CarId;
            existing.StartDate = dto.StartDate;
            existing.EndDate = dto.EndDate;
            existing.ActualStartTime = dto.ActualStartTime;
            existing.ActualEndTime = dto.ActualEndTime;
            existing.Status = dto.Status;
            existing.AgreedPrice = dto.AgreedPrice;
            existing.FinalPrice = dto.FinalPrice;
            existing.OdometerStart = dto.OdometerStart;
            existing.OdometerEnd = dto.OdometerEnd;
            existing.FuelLevelStart = dto.FuelLevelStart;
            existing.FuelLevelEnd = dto.FuelLevelEnd;
            existing.PickupLocation = dto.PickupLocation;
            existing.DropoffLocation = dto.DropoffLocation;

            _context.Entry(existing).State = EntityState.Modified;

            // Update customers - remove existing and add new
            var existingCustomerLinks = await _context.Set<Reservation_Customer>()
                .Where(rc => rc.ReservationId == id)
                .ToListAsync();

            // Remove customers that are no longer associated
            foreach (var link in existingCustomerLinks)
            {
                _context.Set<Reservation_Customer>().Remove(link);
            }

            // Add all customers from the DTO
            foreach (var customerId in dto.CustomersId)
            {
                _context.Set<Reservation_Customer>().Add(new Reservation_Customer
                {
                    Id = Guid.NewGuid(),
                    CustomerId = customerId,
                    ReservationId = id,
                    Date_Added = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated reservation {ReservationId} with {CustomerCount} customers",
                id, dto.CustomersId.Count);

            var resultDto = MapToDto(existing);
            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/Reservations/{id}
        /// Deletes a reservation.
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteReservation(Guid id)
        {
            _logger.LogInformation("Deleting reservation {ReservationId}", id);

            var reservation = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            // Remove all customer links first
            if (reservation.Reservation_Customers != null)
            {
                foreach (var link in reservation.Reservation_Customers)
                {
                    if (link != null)
                    {
                        _context.Set<Reservation_Customer>().Remove(link);
                    }
                }
            }

            // Then remove the reservation
            _context.Set<Reservation>().Remove(reservation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted reservation {ReservationId}", id);
            return NoContent();
        }


        [HttpGet("getAvailableCars")]
        public async Task<IActionResult> GetAvailableCars(
            [FromQuery] DateTime start,
            [FromQuery] DateTime end,
            [FromQuery] Guid carId)
        {
            _logger.LogInformation(
                "Checking availability between {Start} and {End}, include Car {CarId}",
                start, end, carId);

            // Find IDs of cars booked in that period, excluding the current car
            var busyCarIds = await _context.Set<Reservation>()
                .Where(r =>
                    r.CarId != carId &&
                    r.StartDate < end &&
                    r.EndDate > start
                )
                .Select(r => r.CarId)
                .Distinct()
                .ToListAsync();

            // All cars not in busyCarIds
            var availableCars = await _context.Set<Car>()
                .Include(x=> x.Car_Model)
                .ThenInclude(x=> x.Manufacturer)
                .Include(x=> x.Car_Year)
                .Where(c => !busyCarIds.Contains(c.Id))
                .ToListAsync();

            // Map to lightweight DTO
            var result = availableCars.Select(c => new Car
            {
                Id = c.Id,
                AgencyId = c.AgencyId,
                Car_Model = new Models.Filters.Cars.Car_Model
                {
                    Id = c.Car_Model.Id,
                    Name = c.Car_Model.Name,
                    ManufacturerId = c.Car_Model.ManufacturerId,
                    Manufacturer = new Models.Filters.Cars.Manufacturer
                    {
                        Id = c.Car_Model.ManufacturerId,
                        Name = c.Car_Model.Manufacturer.Name
                    }
                },
                Car_ModelId = c.Car_ModelId,
                Car_YearId = c.Car_YearId,
                Car_Year = new Models.Filters.Cars.Car_Year
                {
                    Id = c.Car_YearId,
                    YearValue = c.Car_Year.YearValue
                },
                Color = c.Color,
                DailyRate = c.DailyRate,
                HourlyRate = c.HourlyRate,
                IsAvailable = c.IsAvailable,
                LicensePlate = c.LicensePlate,
                Status = c.Status,
                // add any other fields you need
            });

            return Ok(result);
        }



        [HttpPatch("{id:guid}/car")]
        public async Task<IActionResult> UpdateReservationCar(Guid id, [FromBody] UpdateReservationCarDto dto)
        {
            _logger.LogInformation("Updating car for reservation {ReservationId} to car {CarId}", id, dto.CarId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateReservationCarDto for Reservation {ReservationId}", id);
                return BadRequest(ModelState);
            }

            var reservation = await _context.Set<Reservation>()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            // Verify the car exists
            var carExists = await _context.Set<Car>().AnyAsync(c => c.Id == dto.CarId);
            if (!carExists)
            {
                _logger.LogWarning("Car with Id {CarId} does not exist", dto.CarId);
                return BadRequest(new { message = $"Car with Id '{dto.CarId}' does not exist." });
            }

            // Check if car is available for the reservation period
            var isCarAvailable = await IsCarAvailableForDates(dto.CarId, reservation.StartDate, reservation.EndDate, id);
            if (!isCarAvailable)
            {
                _logger.LogWarning("Car with Id {CarId} is not available for the requested dates", dto.CarId);
                return BadRequest(new { message = $"Car with Id '{dto.CarId}' is not available for the requested dates." });
            }

            // Update the car ID
            reservation.CarId = dto.CarId;
            _context.Entry(reservation).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated car for reservation {ReservationId} to {CarId}", id, dto.CarId);

            return Ok();
        }

        /// <summary>
        /// PATCH: api/Reservations/{id}/dates
        /// Updates only the dates of a reservation.
        /// </summary>
        [HttpPatch("{id:guid}/dates")]
        public async Task<IActionResult> UpdateReservationDates(Guid id, [FromBody] UpdateReservationDatesDto dto)
        {
            _logger.LogInformation("Updating dates for reservation {ReservationId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateReservationDatesDto for Reservation {ReservationId}", id);
                return BadRequest(ModelState);
            }

            // Validate dates
            if (dto.StartDate >= dto.EndDate)
            {
                _logger.LogWarning("Invalid date range: Start date must be before end date");
                return BadRequest(new { message = "Start date must be before end date." });
            }

            var reservation = await _context.Set<Reservation>()
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            // Check if car is available for the new dates
            var isCarAvailable = await IsCarAvailableForDates(reservation.CarId, dto.StartDate, dto.EndDate, id);
            if (!isCarAvailable)
            {
                _logger.LogWarning("Car is not available for the requested dates");
                return BadRequest(new { message = "The car is not available for the requested dates." });
            }

            // Update the dates
            reservation.StartDate = dto.StartDate;
            reservation.EndDate = dto.EndDate;
            _context.Entry(reservation).State = EntityState.Modified;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated dates for reservation {ReservationId}", id);

            return Ok();
        }

        /// <summary>
        /// Helper method to check if a car is available for specific dates
        /// </summary>
        private async Task<bool> IsCarAvailableForDates(Guid carId, DateTime startDate, DateTime endDate, Guid? excludeReservationId = null)
        {
            var query = _context.Set<Reservation>()
                .Where(r => r.CarId == carId)
                .Where(r => r.Status != "Cancelled" && r.Status != "Completed");

            // Exclude the current reservation if provided
            if (excludeReservationId.HasValue)
            {
                query = query.Where(r => r.Id != excludeReservationId.Value);
            }

            // Check for overlapping reservations
            var overlappingReservations = await query
                .Where(r =>
                    (startDate >= r.StartDate && startDate < r.EndDate) || // Start date falls within existing reservation
                    (endDate > r.StartDate && endDate <= r.EndDate) ||     // End date falls within existing reservation
                    (startDate <= r.StartDate && endDate >= r.EndDate))    // New reservation completely contains existing reservation
                .AnyAsync();

            return !overlappingReservations;
        }

        #region Helper Methods & DTOs

        private static ReservationDto MapToDto(Reservation r)
        {
            return new ReservationDto
            {
                Id = r.Id,
                AgencyId = r.AgencyId,
                AgencyName = r.Agency?.Name,
                CarId = r.CarId,
                CarLicensePlate = r.Car?.LicensePlate,
                Customers = r.Reservation_Customers?.Select(x => x.Customer).ToList(),
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
                Invoice = r.Invoice == null
                    ? null
                    : new InvoiceDto
                    {
                        Id = r.Invoice.Id,
                        InvoiceNumber = r.Invoice.Id.ToString(),
                        TotalAmount = r.Invoice.Amount,
                        IssuedOn = r.Invoice.IssuedAt
                    }
            };
        }

        public class ReservationDto
        {
            public Guid Id { get; set; }
            public Guid AgencyId { get; set; }
            public string? AgencyName { get; set; }
            public Guid CarId { get; set; }
            public string? CarLicensePlate { get; set; }

            public List<Customer>? Customers { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public DateTime? ActualStartTime { get; set; }
            public DateTime? ActualEndTime { get; set; }
            public string Status { get; set; }
            public decimal AgreedPrice { get; set; }
            public decimal? FinalPrice { get; set; }
            public decimal? OdometerStart { get; set; }
            public decimal? OdometerEnd { get; set; }
            public float? FuelLevelStart { get; set; }
            public float? FuelLevelEnd { get; set; }
            public string? PickupLocation { get; set; }
            public string? DropoffLocation { get; set; }
            public InvoiceDto? Invoice { get; set; }
        }

        public class CreateReservationDto
        {
            public Guid AgencyId { get; set; }
            public Guid CarId { get; set; }
            public List<Guid> CustomersId { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Status { get; set; }           // Optional (defaults to "Reserved")
            public decimal AgreedPrice { get; set; }
            public string? PickupLocation { get; set; }
            public string? DropoffLocation { get; set; }
        }

        public class UpdateReservationDto
        {
            public Guid Id { get; set; }
            public Guid AgencyId { get; set; }
            public Guid CarId { get; set; }
            public List<Guid> CustomersId { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public DateTime? ActualStartTime { get; set; }
            public DateTime? ActualEndTime { get; set; }
            public string Status { get; set; }
            public decimal AgreedPrice { get; set; }
            public decimal? FinalPrice { get; set; }
            public decimal? OdometerStart { get; set; }
            public decimal? OdometerEnd { get; set; }
            public float? FuelLevelStart { get; set; }
            public float? FuelLevelEnd { get; set; }
            public string? PickupLocation { get; set; }
            public string? DropoffLocation { get; set; }
        }

        public class InvoiceDto
        {
            public Guid Id { get; set; }
            public string InvoiceNumber { get; set; }
            public decimal TotalAmount { get; set; }
            public DateTime IssuedOn { get; set; }
        }

        /// <summary>
        /// DTO for updating only the car of a reservation
        /// </summary>
        public class UpdateReservationCarDto
        {
            public Guid CarId { get; set; }
        }

        /// <summary>
        /// DTO for updating only the dates of a reservation
        /// </summary>
        public class UpdateReservationDatesDto
        {
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
        }
        #endregion
    }
}