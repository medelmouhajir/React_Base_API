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
                    .ThenInclude(x=> x.Car_Model)
                    .ThenInclude(x=> x.Manufacturer)
                    .Include(r => r.Reservation_Customers)
                    .ThenInclude(x => x.Customer)
                    .Include(r => r.Invoice)
                    .Where(x=> x.Id == id)
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
                        Customers = x.Reservation_Customers.Select(c=> 
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
                .Where(r => r.Reservation_Customers.Any( x=> x.Id == customerId))
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
            _logger.LogInformation("Creating new reservation for Agency {AgencyId}, Customer {CustomerId}", dto.AgencyId, dto.CustomerId);

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

            // Verify Customer exists
            var customerExists = await _context.Set<Customer>().AnyAsync(c => c.Id == dto.CustomerId);
            if (!customerExists)
            {
                _logger.LogWarning("Customer with Id {CustomerId} does not exist", dto.CustomerId);
                return BadRequest(new { message = $"Customer with Id '{dto.CustomerId}' does not exist." });
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

            _context.Set<Reservation_Customer>().Add(new Reservation_Customer { CustomerId = dto.CustomerId , ReservationId = reservation.Id});
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created reservation {ReservationId}", reservation.Id);

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

            // If Customer changed, verify it
            if (existing.Reservation_Customers.Any(x=> x.Id != dto.CustomerId))
            {
                var customerExistsUpdate = await _context.Set<Customer>().AnyAsync(c => c.Id == dto.CustomerId);
                if (!customerExistsUpdate)
                {
                    _logger.LogWarning("Customer with Id {CustomerId} does not exist", dto.CustomerId);
                    return BadRequest(new { message = $"Customer with Id '{dto.CustomerId}' does not exist." });
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
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated reservation {ReservationId}", id);

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
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            _context.Set<Reservation>().Remove(reservation);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted reservation {ReservationId}", id);
            return NoContent();
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
                Customers = r.Reservation_Customers.Select(x=> x.Customer).ToList(),
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
            public Guid CustomerId { get; set; }
            public DateTime StartDate { get; set; }
            public DateTime EndDate { get; set; }
            public string? Status { get; set; }           // Optional (defaults to “Reserved”)
            public decimal AgreedPrice { get; set; }
            public string? PickupLocation { get; set; }
            public string? DropoffLocation { get; set; }
        }

        public class UpdateReservationDto
        {
            public Guid Id { get; set; }
            public Guid AgencyId { get; set; }
            public Guid CarId { get; set; }
            public Guid CustomerId { get; set; }
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

        #endregion
    }
}
