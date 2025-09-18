using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Blacklists;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
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
    public class CustomersController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CustomersController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public CustomersController(MainDbContext context, ILogger<CustomersController> logger, IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Customers
        /// Returns the list of all customers (DTO), including attachments.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllCustomers()
        {
            _logger.LogInformation("Retrieving all customers");
            var customers = await _context.Set<Customer>()
                .Include(c => c.Customer_Attachments)
                .ToListAsync();

            var dtoList = customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                AgencyId = c.AgencyId,
                FullName = c.FullName,
                PhoneNumber = c.PhoneNumber,
                Email = c.Email,
                NationalId = c.NationalId,
                PassportId = c.PassportId,
                LicenseNumber = c.LicenseNumber,
                DateOfBirth = c.DateOfBirth,
                Address = c.Address,
                IsBlacklisted = c.IsBlacklisted,
                Attachments = c.Customer_Attachments?
                    .Select(a => new CustomerAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} customers", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Customers/{id}
        /// Returns a single customer by Id (DTO), including attachments.
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetCustomerById(Guid id)
        {
            _logger.LogInformation("Retrieving customer with Id {CustomerId}", id);
            var customer = await _context.Set<Customer>()
                .Include(c => c.Customer_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", id);
                return NotFound(new { message = $"Customer with Id '{id}' not found." });
            }


            if (!await _authService.HasAccessToAgencyAsync(customer.AgencyId))
                return Unauthorized();

            var dto = new CustomerDto
            {
                Id = customer.Id,
                AgencyId = customer.AgencyId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Email = customer.Email,
                NationalId = customer.NationalId,
                PassportId = customer.PassportId,
                LicenseNumber = customer.LicenseNumber,
                DateOfBirth = customer.DateOfBirth,
                Address = customer.Address,
                IsBlacklisted = customer.IsBlacklisted,
                Attachments = customer.Customer_Attachments?
                    .Select(a => new CustomerAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            };

            _logger.LogInformation("Retrieved customer: {CustomerId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Customers/agency/{agencyId}
        /// Returns all customers under a given Agency (DTO), including attachments.
        /// </summary>
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetCustomersByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving customers for Agency {AgencyId}", agencyId);


            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == agencyId);

            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} not found", agencyId);
                return NotFound(new { message = $"Agency with Id '{agencyId}' does not exist." });
            }

            var customers = await _context.Set<Customer>()
                .Where(c => c.AgencyId == agencyId)
                .Include(c => c.Customer_Attachments)
                .ToListAsync();

            var dtoList = customers.Select(c => new CustomerDto
            {
                Id = c.Id,
                AgencyId = c.AgencyId,
                FullName = c.FullName,
                PhoneNumber = c.PhoneNumber,
                Email = c.Email,
                NationalId = c.NationalId,
                PassportId = c.PassportId,
                LicenseNumber = c.LicenseNumber,
                DateOfBirth = c.DateOfBirth,
                Address = c.Address,
                IsBlacklisted = c.IsBlacklisted,
                Attachments = c.Customer_Attachments?
                    .Select(a => new CustomerAttachmentDto
                    {
                        Id = a.Id,
                        FileName = a.FileName,
                        FilePath = a.FilePath,
                        UploadedAt = a.UploadedAt
                    })
                    .ToList()
            }).ToList();

            _logger.LogInformation("Retrieved {Count} customers for Agency {AgencyId}", dtoList.Count, agencyId);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/Customers
        /// Creates a new customer. Accepts CreateCustomerDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerDto dto)
        {
            _logger.LogInformation("Creating new customer for Agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCustomerDto received");
                return BadRequest(ModelState);
            }


            if (!await _authService.HasAccessToAgencyAsync(dto.AgencyId))
                return Unauthorized();

            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == dto.AgencyId);

            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
            }

            var customer = new Customer
            {
                Id = Guid.NewGuid(),
                AgencyId = dto.AgencyId,
                FullName = dto.FullName,
                PhoneNumber = dto.PhoneNumber,
                Email = dto.Email,
                NationalId = dto.NationalId,
                PassportId = dto.PassportId,
                LicenseNumber = dto.LicenseNumber,
                DateOfBirth = dto.DateOfBirth ?? new DateTime(),
                Address = dto.Address,
                IsBlacklisted = dto.IsBlacklisted,
                Customer_Attachments = new List<Customer_Attachment>()
            };

            _context.Set<Customer>().Add(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created customer {CustomerId}", customer.Id);

            var resultDto = new CustomerDto
            {
                Id = customer.Id,
                AgencyId = customer.AgencyId,
                FullName = customer.FullName,
                PhoneNumber = customer.PhoneNumber,
                Email = customer.Email,
                NationalId = customer.NationalId,
                PassportId = customer.PassportId,
                LicenseNumber = customer.LicenseNumber,
                DateOfBirth = customer.DateOfBirth,
                Address = customer.Address,
                IsBlacklisted = customer.IsBlacklisted,
                Attachments = new List<CustomerAttachmentDto>()
            };

            return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Customers/{id}
        /// Updates an existing customer. Accepts UpdateCustomerDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateCustomer(Guid id, [FromBody] UpdateCustomerDto dto)
        {
            _logger.LogInformation("Updating customer {CustomerId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateCustomerDto for Customer {CustomerId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existingCustomer = await _context.Set<Customer>()
                .Include(c => c.Customer_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (existingCustomer == null)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", id);
                return NotFound(new { message = $"Customer with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(existingCustomer.AgencyId))
                return Unauthorized();

            if (existingCustomer.AgencyId != dto.AgencyId)
            {
                var agencyExists = await _context.Set<Agency>()
                    .AnyAsync(a => a.Id == dto.AgencyId);

                if (!agencyExists)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.AgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.AgencyId}' does not exist." });
                }
            }

            // Update scalar properties
            existingCustomer.AgencyId = dto.AgencyId;
            existingCustomer.FullName = dto.FullName;
            existingCustomer.PhoneNumber = dto.PhoneNumber;
            existingCustomer.Email = dto.Email;
            existingCustomer.NationalId = dto.NationalId;
            existingCustomer.PassportId = dto.PassportId;
            existingCustomer.LicenseNumber = dto.LicenseNumber;
            existingCustomer.DateOfBirth = dto.DateOfBirth;
            existingCustomer.Address = dto.Address;
            existingCustomer.IsBlacklisted = dto.IsBlacklisted;

            // If attachments are provided, replace existing attachments
            if (dto.Attachments != null)
            {
                _logger.LogInformation("Updating attachments for Customer {CustomerId}", id);

                _context.Set<Customer_Attachment>().RemoveRange(existingCustomer.Customer_Attachments);

                foreach (var attachDto in dto.Attachments)
                {
                    var newAttach = new Customer_Attachment
                    {
                        Id = Guid.NewGuid(),
                        FileName = attachDto.FileName,
                        FilePath = attachDto.FilePath,
                        CustomerId = existingCustomer.Id,
                        UploadedAt = DateTime.UtcNow
                    };
                    _context.Set<Customer_Attachment>().Add(newAttach);
                }
            }

            _context.Entry(existingCustomer).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated customer {CustomerId}", id);

            var resultDto = new CustomerDto
            {
                Id = existingCustomer.Id,
                AgencyId = existingCustomer.AgencyId,
                FullName = existingCustomer.FullName,
                PhoneNumber = existingCustomer.PhoneNumber,
                Email = existingCustomer.Email,
                NationalId = existingCustomer.NationalId,
                PassportId = existingCustomer.PassportId,
                LicenseNumber = existingCustomer.LicenseNumber,
                DateOfBirth = existingCustomer.DateOfBirth,
                Address = existingCustomer.Address,
                IsBlacklisted = existingCustomer.IsBlacklisted,
                Attachments = existingCustomer.Customer_Attachments?
                    .Select(a => new CustomerAttachmentDto
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
        /// DELETE: api/Customers/{id}
        /// Deletes a customer and all its attachments.
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteCustomer(Guid id)
        {
            _logger.LogInformation("Deleting customer {CustomerId}", id);

            var customer = await _context.Set<Customer>()
                .Include(c => c.Customer_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", id);
                return NotFound(new { message = $"Customer with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(customer.AgencyId))
                return Unauthorized();

            if (customer.Customer_Attachments != null && customer.Customer_Attachments.Any())
            {
                _logger.LogInformation("Removing {Count} attachments for Customer {CustomerId}", customer.Customer_Attachments.Count, id);
                _context.Set<Customer_Attachment>().RemoveRange(customer.Customer_Attachments);
            }

            _context.Set<Customer>().Remove(customer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted customer {CustomerId}", id);
            return NoContent();
        }

        /// <summary>
        /// POST: api/Customers/{id}/attachments
        /// Adds an attachment to an existing customer.
        /// </summary>
        [HttpPost("{id:guid}/attachments")]
        public async Task<IActionResult> AddAttachmentToCustomer(Guid id, [FromBody] CreateCustomerAttachmentDto dto)
        {
            _logger.LogInformation("Adding attachment to Customer {CustomerId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCustomerAttachmentDto for Customer {CustomerId}", id);
                return BadRequest(ModelState);
            }

            var customer = await _context.Set<Customer>()
                .Include(c => c.Customer_Attachments)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (customer == null)
            {
                _logger.LogWarning("Customer with Id {CustomerId} not found", id);
                return NotFound(new { message = $"Customer with Id '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(customer.AgencyId))
                return Unauthorized();

            var attachment = new Customer_Attachment
            {
                Id = Guid.NewGuid(),
                FileName = dto.FileName,
                FilePath = dto.FilePath,
                CustomerId = id,
                UploadedAt = DateTime.UtcNow
            };

            _context.Set<Customer_Attachment>().Add(attachment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added attachment {AttachmentId} to Customer {CustomerId}", attachment.Id, id);

            var attachmentDto = new CustomerAttachmentDto
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                FilePath = attachment.FilePath,
                UploadedAt = attachment.UploadedAt
            };

            return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, attachmentDto);
        }


        [HttpGet("{agencyId:guid}/exist")]
        public async Task<IActionResult> CheckCustomerIfExist(
            Guid agencyId,
            [FromQuery] string? nationalId,
            [FromQuery] string? passportId,
            [FromQuery] string? licenseNumber)
        {
            _logger.LogInformation(
                "Searching blacklist entries with NationalId='{NationalId}', PassportId='{PassportId}', LicenseNumber='{LicenseNumber}'",
                nationalId, passportId, licenseNumber);

            IQueryable<Customer> query = _context.Set<Customer>()
                .Where(x=> x.AgencyId == agencyId);

            if (!string.IsNullOrWhiteSpace(nationalId))
            {
                query = query.Where(e => e.NationalId != null && e.NationalId.Contains(nationalId));
            }

            if (!string.IsNullOrWhiteSpace(passportId))
            {
                query = query.Where(e => e.PassportId != null && e.PassportId.Contains(passportId));
            }

            if (!string.IsNullOrWhiteSpace(licenseNumber))
            {
                query = query.Where(e => e.LicenseNumber != null && e.LicenseNumber.Contains(licenseNumber));
            }

            var results = await query.ToListAsync();

            var dtoList = results.Select(e => new CustomerDto
            {
                Id = e.Id,
                NationalId = e.NationalId,
                PassportId = e.PassportId,
                LicenseNumber = e.LicenseNumber,
                FullName = e.FullName,
            }).ToList();

            _logger.LogInformation("Search returned {Count} entries", dtoList.Count);
            return Ok(dtoList);
        }
    }

    #region DTOs

    public class CustomerDto
    {
        public Guid Id { get; set; }
        public Guid AgencyId { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string LicenseNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; }
        public bool IsBlacklisted { get; set; }
        public List<CustomerAttachmentDto>? Attachments { get; set; }
    }

    public class CreateCustomerDto
    {
        public Guid AgencyId { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string LicenseNumber { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string Address { get; set; }
        public bool IsBlacklisted { get; set; }
    }

    public class UpdateCustomerDto
    {
        public Guid Id { get; set; }
        public Guid AgencyId { get; set; }
        public string FullName { get; set; }
        public string PhoneNumber { get; set; }
        public string Email { get; set; }
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string LicenseNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        public string Address { get; set; }
        public bool IsBlacklisted { get; set; }

        /// <summary>
        /// Optional: if provided, replaces the existing attachments.
        /// </summary>
        public List<CreateCustomerAttachmentDto>? Attachments { get; set; }
    }

    public class CustomerAttachmentDto
    {
        public Guid Id { get; set; }
        public string FileName { get; set; }
        public string FilePath { get; set; }
        public DateTime UploadedAt { get; set; }
    }

    public class CreateCustomerAttachmentDto
    {
        public string FileName { get; set; }
        public string FilePath { get; set; }
    }

    #endregion
}
