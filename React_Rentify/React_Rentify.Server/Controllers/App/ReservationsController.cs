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
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Security.Claims;
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
        private readonly IAgencyAuthorizationService _authService;

        public ReservationsController(MainDbContext context, ILogger<ReservationsController> logger , IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Reservations
        /// Returns all reservations (DTO), including related Agency, Car, Customer, and Invoice info.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllReservations()
        {
            _logger.LogInformation("Retrieving all reservations");
            var reservations = await _context.Set<Reservation>()
                .Include(r => r.Agency)
                .Include(r => r.Car)
                .ThenInclude(x=> x.Car_Model)
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
                    .Include(x=> x.CreatedByUser)
                    .Include(r => r.Invoice)
                    .Where(x => x.Id == id)
                    .Select(x => new
                    {
                        AgencyId = x.AgencyId,
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
                            PhoneTwo = x.Agency.PhoneTwo,
                            LogoUrlAssociation = x.Agency.LogoUrlAssociation,
                            Conditions = x.Agency.Conditions
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
                            },
                            CurrentKM = x.Car.CurrentKM,
                            LastKmUpdate = x.Car.LastKmUpdate
                        },
                        CreatedBy = x.CreatedByUser == null ? null : new
                        {
                            x.CreatedByUser.Id,
                            x.CreatedByUser.FullName,
                            x.CreatedByUser.Picture
                        }
                    })
                    .FirstOrDefaultAsync();

                if (reservation == null)
                {
                    _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                    return NotFound(new { message = $"Reservation with Id '{id}' not found." });
                }



                if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                    return Unauthorized();

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
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

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
                    .ThenInclude(x=> x.Car_Model)
                    .Include(r => r.Reservation_Customers)
                    .ThenInclude(x=> x.Customer)
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
                .FirstOrDefaultAsync(c => c.Id == customerId);
            if (customerExists == null)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", customerId);
                return NotFound(new { message = $"Customer with Id '{customerId}' does not exist." });
            }

            if (!await _authService.HasAccessToAgencyAsync(customerExists.AgencyId))
                return Unauthorized();

            var reservations = await _context.Set<Reservation>()
                .Where(r => r.Reservation_Customers.Any(x => x.CustomerId == customerId))
                .Include(r => r.Agency)
                .Include(r => r.Car)
                .ThenInclude(x => x.Car_Model)
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

            if (!await _authService.HasAccessToAgencyAsync(dto.AgencyId))
                return Unauthorized();

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
                DropoffLocation = dto.DropoffLocation,
                CreatedByUserId = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
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


            return Ok( new { id = reservation.Id});
        }

        /// <summary>
        /// PUT: api/Reservations/{id}
        /// Updates an existing reservation. Accepts UpdateReservationDto.
        /// </summary>
        [HttpPost("{id:guid}")]
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


            if (!await _authService.HasAccessToAgencyAsync(existing.AgencyId))
                return Unauthorized();

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
        [Authorize(Roles = "Owner")]
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


            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

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


        [HttpPost("{id:guid}/customers/{CustomerId:guid}")]
        public async Task<IActionResult> AddCustomerToReservation(Guid id, Guid CustomerId)
        {
            _logger.LogInformation("Adding customer {CustomerId} to reservation {ReservationId}", CustomerId, id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid AddCustomerToReservationDto for Reservation {ReservationId}", id);
                return BadRequest(ModelState);
            }

            // Verify reservation exists
            var reservation = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

            // Verify customer exists
            var customerExists = await _context.Set<Customer>().AnyAsync(c => c.Id == CustomerId);
            if (!customerExists)
            {
                _logger.LogWarning("Customer with Id {CustomerId} does not exist", CustomerId);
                return BadRequest(new { message = $"Customer with Id '{CustomerId}' does not exist." });
            }

            // Check if customer is already associated with this reservation
            var existingLink = await _context.Set<Reservation_Customer>()
                .AnyAsync(rc => rc.ReservationId == id && rc.CustomerId == CustomerId);

            if (existingLink)
            {
                _logger.LogWarning("Customer {CustomerId} is already associated with Reservation {ReservationId}",
                    CustomerId, id);
                return BadRequest(new { message = "This customer is already associated with the reservation." });
            }

            // Add the new customer link
            var newLink = new Reservation_Customer
            {
                Id = Guid.NewGuid(),
                CustomerId = CustomerId,
                ReservationId = id,
                Date_Added = DateTime.UtcNow
            };

            _context.Set<Reservation_Customer>().Add(newLink);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added customer {CustomerId} to reservation {ReservationId}",
                CustomerId, id);

            return Ok();
        }

        [Authorize(Roles = "Owner")]
        [HttpDelete("{id:guid}/customers/{customerId:guid}")]
        public async Task<IActionResult> RemoveCustomerFromReservation(Guid id, Guid customerId)
        {
            _logger.LogInformation("Removing customer {CustomerId} from reservation {ReservationId}",
                customerId, id);

            // Verify reservation exists
            var reservation = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

            // Find the customer link
            var customerLink = await _context.Set<Reservation_Customer>()
                .FirstOrDefaultAsync(rc => rc.ReservationId == id && rc.CustomerId == customerId);

            if (customerLink == null)
            {
                _logger.LogWarning("Customer {CustomerId} is not associated with Reservation {ReservationId}",
                    customerId, id);
                return NotFound(new { message = "This customer is not associated with the reservation." });
            }

            // Check if this is the last customer (a reservation must have at least one customer)
            var customerCount = await _context.Set<Reservation_Customer>()
                .CountAsync(rc => rc.ReservationId == id);

            if (customerCount <= 1)
            {
                _logger.LogWarning("Cannot remove the last customer from Reservation {ReservationId}", id);
                return BadRequest(new { message = "Cannot remove the last customer from the reservation. A reservation must have at least one customer." });
            }

            // Remove the customer link
            _context.Set<Reservation_Customer>().Remove(customerLink);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed customer {CustomerId} from reservation {ReservationId}",
                customerId, id);

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

            var car = await _context.Cars.FindAsync(carId);
            if (car == null)
                return BadRequest();

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

            // Find IDs of cars booked in that period, excluding the current car
            var busyCarIds = await _context.Set<Reservation>()
                .Where(r =>
                    r.CarId != carId &&
                    r.StartDate < end &&
                    r.EndDate > start &&
                    r.AgencyId == car.AgencyId
                )
                .Select(r => r.CarId)
                .Distinct()
                .ToListAsync();

            // All cars not in busyCarIds
            var availableCars = await _context.Set<Car>()
                .Include(x=> x.Car_Model)
                .ThenInclude(x=> x.Manufacturer)
                .Include(x=> x.Car_Year)
                .Where(c => !busyCarIds.Contains(c.Id) && c.AgencyId == car.AgencyId)
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

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

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

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

            // Check if car is available for the new dates
            //var isCarAvailable = await IsCarAvailableForDates(reservation.CarId, dto.StartDate, dto.EndDate, id);
            //if (!isCarAvailable)
            //{
            //    _logger.LogWarning("Car is not available for the requested dates");
            //    return BadRequest(new { message = "The car is not available for the requested dates." });
            //}

            // Update the dates
            reservation.StartDate = dto.StartDate.ToUniversalTime();
            reservation.EndDate = dto.EndDate.ToUniversalTime();
            _context.Entry(reservation).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch(Exception e)
            {

            }

            _logger.LogInformation("Updated dates for reservation {ReservationId}", id);

            return Ok();
        }

        [HttpPost("{id:guid}/deliver")]
        public async Task<IActionResult> ReservationDeliverCar(Guid id , [FromBody] ReservationDeliverCarDTO dto)
        {
            _logger.LogInformation("UDeliver car for reservation {ReservationId}", id);


            var reservation = await _context.Set<Reservation>()
                .Include(x=> x.Car)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();

            // Validate dates
            if ( reservation.Status != "Reserved")
            {
                _logger.LogWarning("Invalid status : " + reservation.Status);
                return BadRequest(new { message = "Status must be 'Reserved'." });
            }

            // Update the dates
            reservation.Status = "Ongoing";
            reservation.ActualStartTime = dto.DeliveryDate.ToUniversalTime();
            reservation.OdometerStart = dto.OdometerStart;
            reservation.FuelLevelStart = 100;

            reservation.Car.Status = "Rented";
            reservation.Car.CurrentKM = dto.OdometerStart;
            reservation.Car.LastKmUpdate = DateTime.UtcNow;

            _context.Entry(reservation).State = EntityState.Modified;

            _context.Entry(reservation.Car).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch(Exception e)
            {

            }

            _logger.LogInformation("Updated dates for reservation {ReservationId}", id);

            return Ok();
        }
        [HttpPost("{id:guid}/return")]
        public async Task<IActionResult> ReservationReturnCar(Guid id , [FromBody] ReservationReturnCarDTO dto)
        {
            _logger.LogInformation("UDeliver car for reservation {ReservationId}", id);


            var reservation = await _context.Set<Reservation>()
                .Include(x => x.Car)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (reservation == null)
            {
                _logger.LogWarning("Reservation with Id {ReservationId} not found", id);
                return NotFound(new { message = $"Reservation with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(reservation.AgencyId))
                return Unauthorized();


            // Validate dates
            if ( reservation.Status != "Ongoing")
            {
                _logger.LogWarning("Invalid status : " + reservation.Status);
                return BadRequest(new { message = "Status must be 'Ongoing'." });
            }

            // Update the dates
            reservation.Status = "Completed";
            reservation.ActualEndTime = dto.ReturnDate.ToUniversalTime();
            reservation.OdometerEnd = dto.OdometerEnd;
            reservation.FuelLevelEnd = 100;

            reservation.Car.Status = "Available";
            reservation.Car.CurrentKM = dto.OdometerEnd;
            reservation.Car.LastKmUpdate = DateTime.UtcNow;

            _context.Entry(reservation).State = EntityState.Modified;

            _context.Entry(reservation.Car).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch(Exception e)
            {

            }

            _logger.LogInformation("Updated dates for reservation {ReservationId}", id);

            return Ok();
        }

        /// <summary>
        /// Helper method to check if a car is available for specific dates
        /// </summary>
        private async Task<bool> IsCarAvailableForDates(Guid carId, DateTime startDate, DateTime endDate, Guid? excludeReservationId = null)
        {
            var car = await _context.Cars.FindAsync(carId);
            if (car == null)
                return false;

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return false;

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


        [HttpGet("car/{carId:guid}")]
        public async Task<IActionResult> GetReservationsByCarId(Guid carId)
        {
            _logger.LogInformation("Retrieving reservations for car {CarId}", carId);

            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();

            var reservations = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                    .ThenInclude(rc => rc.Customer)
                .Where(r => r.CarId == carId)
                .ToListAsync();

            var dtoList = reservations.Select(r => new ReservationDto
            {
                Id = r.Id,
                CarId = r.CarId,
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

            _logger.LogInformation("Retrieved {Count} reservations for car {CarId}", dtoList.Count, carId);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/reservations/car/{carId}/current
        /// Returns the current reservation for a car, if any.
        /// </summary>
        [HttpGet("car/{carId:guid}/current")]
        public async Task<IActionResult> GetCurrentReservation(Guid carId)
        {
            _logger.LogInformation("Retrieving current reservation for car {CarId}", carId);

            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();


            var now = DateTime.UtcNow;
            var currentReservation = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                    .ThenInclude(rc => rc.Customer)
                .Where(r => r.CarId == carId
                        && r.StartDate <= now
                        && r.EndDate >= now
                        && r.Status == "Ongoing")
                .FirstOrDefaultAsync();

            if (currentReservation == null)
            {
                return NotFound(new { message = $"No current reservation found for car '{carId}'." });
            }

            var dto = new ReservationDto
            {
                Id = currentReservation.Id,
                CarId = currentReservation.CarId,
                StartDate = currentReservation.StartDate,
                EndDate = currentReservation.EndDate,
                ActualStartTime = currentReservation.ActualStartTime,
                ActualEndTime = currentReservation.ActualEndTime,
                Status = currentReservation.Status,
                AgreedPrice = currentReservation.AgreedPrice,
                FinalPrice = currentReservation.FinalPrice,
                OdometerStart = currentReservation.OdometerStart,
                OdometerEnd = currentReservation.OdometerEnd,
                FuelLevelStart = currentReservation.FuelLevelStart,
                FuelLevelEnd = currentReservation.FuelLevelEnd,
                PickupLocation = currentReservation.PickupLocation,
                DropoffLocation = currentReservation.DropoffLocation,
                Reservation_Customers = currentReservation.Reservation_Customers?.Select(rc => new ReservationCustomerDto
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
            };

            _logger.LogInformation("Retrieved current reservation {ReservationId} for car {CarId}", currentReservation.Id, carId);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/reservations/car/{carId}/upcoming
        /// Returns upcoming reservations for a car.
        /// </summary>
        [HttpGet("car/{carId:guid}/upcoming")]
        public async Task<IActionResult> GetUpcomingReservations(Guid carId)
        {
            _logger.LogInformation("Retrieving upcoming reservations for car {CarId}", carId);

            var carExists = await _context.Set<Car>().FirstOrDefaultAsync(c => c.Id == carId);
            if (carExists == null)
            {
                _logger.LogWarning("Car with Id {CarId} not found", carId);
                return NotFound(new { message = $"Car with Id '{carId}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(carExists.AgencyId))
                return Unauthorized();

            var now = DateTime.UtcNow;
            var upcomingReservations = await _context.Set<Reservation>()
                .Include(r => r.Reservation_Customers)
                    .ThenInclude(rc => rc.Customer)
                .Where(r => r.CarId == carId
                        && r.StartDate > now
                        && r.Status == "Reserved")
                .OrderBy(r => r.StartDate)
                .ToListAsync();

            var dtoList = upcomingReservations.Select(r => new ReservationDto
            {
                Id = r.Id,
                CarId = r.CarId,
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

            _logger.LogInformation("Retrieved {Count} upcoming reservations for car {CarId}", dtoList.Count, carId);
            return Ok(dtoList);
        }

        [Authorize(Roles = "Owner")]
        [HttpPut("{id}/prices")]
        public async Task<IActionResult> UpdateReservationPrices(Guid id, [FromBody] UpdateReservationPricesDto pricesDto)
        {
            try
            {
                // Validate the reservation exists and belongs to the user's agency
                var existingReservation = await _context.Reservations
                    .Include(r => r.Agency)
                    .FirstOrDefaultAsync(r => r.Id == id);

                if (existingReservation == null)
                {
                    return NotFound(new { message = "Reservation not found" });
                }

                // Check if user has permission to modify this reservation

                if (!await _authService.HasAccessToAgencyAsync(existingReservation.AgencyId))
                    return Unauthorized();

                // Validate that the reservation can be modified (not completed or cancelled)
                if (existingReservation.Status == "Completed" || existingReservation.Status == "Cancelled")
                {
                    return BadRequest(new { message = "Cannot modify prices for completed or cancelled reservations" });
                }

                // Validate price values
                if (pricesDto.AgreedPrice < 0 || pricesDto.FinalPrice < 0)
                {
                    return BadRequest(new { message = "Prices cannot be negative" });
                }

                // Update the reservation prices
                existingReservation.AgreedPrice = pricesDto.AgreedPrice;
                existingReservation.FinalPrice = pricesDto.FinalPrice;

                // Add audit trail for price changes
                var priceHistory = new ReservationPriceHistory
                {
                    Id = Guid.NewGuid(),
                    ReservationId = id,
                    PreviousAgreedPrice = existingReservation.AgreedPrice,
                    NewAgreedPrice = pricesDto.AgreedPrice,
                    PreviousFinalPrice = existingReservation.FinalPrice ?? pricesDto.AgreedPrice,
                    NewFinalPrice = pricesDto.FinalPrice,
                    AdditionalFees = pricesDto.AdditionalFees,
                    AdditionalFeesReason = pricesDto.AdditionalFeesReason,
                    Discount = pricesDto.Discount,
                    DiscountReason = pricesDto.DiscountReason,
                    UpdatedAt = DateTime.UtcNow,
                    UpdatedBy = GetUserId() // Assuming you have a method to get current user ID
                };

                // Add the price history record (if you have this table)
                // _context.ReservationPriceHistories.Add(priceHistory);

                // Save changes
                await _context.SaveChangesAsync();

                // Return updated reservation data
                var updatedReservation = await _context.Reservations
                    .Include(r => r.Agency)
                    .Include(r => r.Car)
                        .ThenInclude(c => c.Car_Model)
                            .ThenInclude(m => m.Manufacturer)
                    .Include(r => r.Reservation_Customers)
                        .ThenInclude(rc => rc.Customer)
                    .Select(r => new ReservationDto
                    {
                        Id = r.Id,
                        AgencyId = r.AgencyId,
                        AgencyName = r.Agency.Name,
                        CarId = r.CarId,
                        CarLicensePlate = r.Car.LicensePlate,
                        Model = r.Car.Car_Model.Name + " " + r.Car.Car_Model.Manufacturer.Name,
                        Customers = r.Reservation_Customers.Select(rc => new Customer
                        {
                            Id = rc.CustomerId,
                            FullName = rc.Customer.FullName,
                            Email = rc.Customer.Email,
                            PhoneNumber = rc.Customer.PhoneNumber
                        }).ToList(),
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
                        DropoffLocation = r.DropoffLocation
                    })
                    .FirstOrDefaultAsync(r => r.Id == id);

                return Ok(updatedReservation);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating reservation prices for reservation {ReservationId}", id);
                return StatusCode(500, new { message = "An error occurred while updating reservation prices" });
            }
        }

        private string GetUserId()
        {
            // Extract user ID from claims
            return User.FindFirst("sub")?.Value ??
                   User.FindFirst("id")?.Value ??
                   User.FindFirst(ClaimTypes.NameIdentifier)?.Value ??
                   "Unknown";
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
                Customers = r.Reservation_Customers?.Select(x => new Customer
                {
                    Id = x.Customer.Id,
                    FullName = x.Customer.FullName,
                    Address = x.Customer.Address,
                    PhoneNumber = x.Customer.PhoneNumber
                }).ToList(),
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
                Model = r.Car.Car_Model.Name,
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
            public string? Model { get; set; }

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

            public List<ReservationCustomerDto>? Reservation_Customers { get; set; }
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

        public class ReservationDeliverCarDTO
        {
            public int OdometerStart { get; set; }
            public string FuelLevel { get; set; }
            public string deliveryNotes { get; set; }
            public DateTime DeliveryDate { get; set; }

            public bool HasPreExistingDamage { get; set; }
            public string? DamageDescription { get; set; }
            public string? DepositPaymentMethodn { get; set; }
            public int DepositAmount { get; set; }
            public int AdditionalFees { get; set; }
            public string? AdditionalFeesReason { get; set; }
        }

        public class ReservationReturnCarDTO
        {
            public int OdometerEnd { get; set; }
            public string FuelLevel { get; set; }
            public string ReturnNotes { get; set; }
            public DateTime ReturnDate { get; set; }

            public bool HasDamage { get; set; }
            public string? DamageDescription { get; set; }
            public int AdditionalCharges { get; set; }
            public string? AdditionalChargesReason { get; set; }
        }

        #endregion
    }

    public class CustomerBasicDto
    {
        public Guid Id { get; set; }
        public object Name { get; set; }
        public string Email { get; set; }
        public object Phone { get; set; }
    }

    public class ReservationCustomerDto
    {
        public Guid ReservationId { get; set; }
        public Guid CustomerId { get; set; }
        public object IsPrimary { get; set; }
        public object Customer { get; set; }
    }

    public class UpdateReservationPricesDto
    {
        public decimal AgreedPrice { get; set; }
        public decimal FinalPrice { get; set; }
        public decimal AdditionalFees { get; set; }
        public string? AdditionalFeesReason { get; set; }
        public decimal Discount { get; set; }
        public string? DiscountReason { get; set; }
    }

    // Optional: Add this model for price history tracking
    public class ReservationPriceHistory
    {
        public Guid Id { get; set; }
        public Guid ReservationId { get; set; }
        public decimal PreviousAgreedPrice { get; set; }
        public decimal NewAgreedPrice { get; set; }
        public decimal PreviousFinalPrice { get; set; }
        public decimal NewFinalPrice { get; set; }
        public decimal AdditionalFees { get; set; }
        public string? AdditionalFeesReason { get; set; }
        public decimal Discount { get; set; }
        public string? DiscountReason { get; set; }
        public DateTime UpdatedAt { get; set; }
        public string UpdatedBy { get; set; } // User ID who made the change

        // Navigation property
        public Reservation Reservation { get; set; }
    }

}