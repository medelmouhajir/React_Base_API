using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Clients;
using Shared_Models.Invoices;
using System.ComponentModel.DataAnnotations;

namespace React_Lawyer.Server.Controllers.Clients
{
    [Route("api/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<ClientsController> _logger;

        public ClientsController(ApplicationDbContext context, ILogger<ClientsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Clients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetClients()
        {
            return await _context.Clients
                .Where(c => c.IsActive)
                .Select(x=> new
                {
                    x.ClientId,
                    x.LawFirmId,
                    x.FirstName,
                    x.LastName,
                    x.Email,
                    x.PhoneNumber,
                    x.Address,
                    x.IdNumber,
                    Type = x.Type.ToString(),
                    x.CompanyName,
                    x.TaxId,
                    x.Notes,
                    x.CreatedAt,
                    x.IsActive
                })
                .ToListAsync();
        }

        // GET: api/Clients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetClient(int id)
        {
            var client = await _context.Clients
                .Include(c => c.Case_Clients)
                .ThenInclude(x=> x.Case)
                .ThenInclude(x=> x.AssignedLawyer)
                .Include(c => c.Appointments)
                .ThenInclude(x=> x.ScheduledBy)
                .Include(c => c.Invoices)
                .Select(x=> new
                {
                    ClientId = x.ClientId,
                    LawFirmId = x.LawFirmId,
                    FirstName = x.FirstName,
                    LastName = x.LastName,
                    Email = x.Email,
                    PhoneNumber = x.PhoneNumber,
                    Address = x.Address,
                    IdNumber = x.IdNumber,
                    Type = x.Type.ToString(),
                    CompanyName = x.CompanyName,
                    TaxId = x.TaxId,
                    Notes = x.Notes,
                    CreatedAt = x.CreatedAt,
                    IsActive = x.IsActive,
                    Cases = x.Case_Clients.Select(c=> new
                    {
                        CaseId = c.CaseId,
                        CaseNumber = c.Case.CaseNumber,
                        ActualSettlement = c.Case.ActualSettlement,
                        AssignedLawyer = new Shared_Models.Users.Lawyer
                        {
                            LawyerId = c.Case.AssignedLawyer.LawyerId,
                            User = new Shared_Models.Users.User
                            {
                                FirstName = c.Case.AssignedLawyer.User.FirstName,
                                LastName = c.Case.AssignedLawyer.User.LastName,
                                Email = c.Case.AssignedLawyer.User.Email,
                                PhoneNumber = c.Case.AssignedLawyer.User.PhoneNumber
                            }
                        },
                        Status = c.Case.Status.ToString()
                    }).ToList(),
                    Appointments = x.Appointments
                                        .Select(x=> new
                                        {
                                            AppointmentId = x.AppointmentId,
                                            Title = x.Title,
                                            Description = x.Description,
                                            StartTime = x.StartTime,
                                            EndTime = x.EndTime,
                                            Location = x.Location,
                                            Status = x.Status.ToString(),
                                            ScheduledBy = new Shared_Models.Users.User
                                            {
                                                FirstName = x.ScheduledBy.FirstName,
                                                LastName = x.ScheduledBy.LastName,
                                                Email = x.ScheduledBy.Email,
                                                PhoneNumber = x.ScheduledBy.PhoneNumber
                                            }
                                        }).ToList(),
                    Invoices = x.Invoices
                    .Select( z=> new
                    {
                        InvoiceId = z.InvoiceId,
                        Status = z.Status.ToString(),
                        Amount = z.Amount,
                        CaseId = z.CaseId,
                        ClientId = z.ClientId,
                        DueDate = z.DueDate,
                        InvoiceNumber = z.InvoiceNumber,
                        IssueDate = z.IssueDate,
                        Notes = z.Notes,
                        PaidAmount = z.PaidAmount,
                        PaidDate = z.PaidDate,
                        PaymentMethod = z.PaymentMethod == null ? ""  : z.PaymentMethod.ToString(),
                        PaymentReference = z.PaymentReference,
                        TaxAmount = z.TaxAmount,
                        z.TotalAmount
                    })
                    .ToList()
                })
                .FirstOrDefaultAsync(c => c.ClientId == id);

            if (client == null)
            {
                return NotFound();
            }

            return client;
        }

        // GET: api/Clients/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetClientsByFirm(int firmId)
        {
            return await _context.Clients
                .Where(c => c.LawFirmId == firmId && c.IsActive)
                .Select(x => new
                {
                    x.ClientId,
                    x.LawFirmId,
                    x.FirstName,
                    x.LastName,
                    x.Email,
                    x.PhoneNumber,
                    x.Address,
                    x.IdNumber,
                    Type = x.Type.ToString(),
                    x.CompanyName,
                    x.TaxId,
                    x.Notes,
                    x.CreatedAt,
                    x.IsActive
                })
                .ToListAsync();
        }

        // GET: api/Clients/Search?term={searchTerm}
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchClients(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
            {
                return await GetClients();
            }

            term = term.ToLower();
            return await _context.Clients
                .Where(c => c.IsActive && (
                    c.FirstName.ToLower().Contains(term) ||
                    c.LastName.ToLower().Contains(term) ||
                    c.Email.ToLower().Contains(term) ||
                    c.PhoneNumber.Contains(term) ||
                    c.CompanyName.ToLower().Contains(term)
                ))
                .Select(x=> new
                {
                    x.ClientId,
                    x.LawFirmId,
                    x.FirstName,
                    x.LastName,
                    x.Email,
                    x.PhoneNumber,
                    x.Address,
                    x.IdNumber,
                    Type = x.Type.ToString(),
                    x.CompanyName,
                    x.TaxId,
                    x.Notes,
                    x.CreatedAt,
                    x.IsActive
                })
                .ToListAsync();
        }

        // POST: api/Clients
        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient(ClientCreateModel model)
        {
            try
            {
                // Validate law firm exists
                if (model.LawFirmId <= 0)
                {
                    return BadRequest("A valid law firm ID is required");
                }

                var lawFirmExists = await _context.LawFirms.AnyAsync(f => f.LawFirmId == model.LawFirmId);
                if (!lawFirmExists)
                {
                    return BadRequest("The specified law firm does not exist");
                }

                // Create client from model
                var client = new Client
                {
                    LawFirmId = model.LawFirmId,
                    FirstName = model.FirstName,
                    LastName = model.LastName,
                    Email = model.Email,
                    PhoneNumber = model.PhoneNumber,
                    Address = model.Address,
                    IdNumber = model.IdNumber,
                    Type = model.Type,
                    CompanyName = model.CompanyName,
                    TaxId = model.TaxId,
                    Notes = model.Notes,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                // Validate if corporate client has company name
                if (client.Type == ClientType.Corporate && string.IsNullOrWhiteSpace(client.CompanyName))
                {
                    return BadRequest("Company name is required for corporate clients");
                }

                _context.Clients.Add(client);
                await _context.SaveChangesAsync();

                // Log the successful client creation
                _logger.LogInformation("New client created: {ClientId} - {FirstName} {LastName}", client.ClientId, client.FirstName, client.LastName);

                return CreatedAtAction(nameof(GetClient), new { id = client.ClientId }, client);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating client");
                return StatusCode(500, new { message = "An error occurred while creating the client", error = ex.Message });
            }
        }

        // PUT: api/Clients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, ClientUpdateModel model)
        {
            if (id != model.ClientId)
            {
                return BadRequest("ID mismatch");
            }

            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            // Update client properties
            client.FirstName = model.FirstName;
            client.LastName = model.LastName;
            client.Email = model.Email;
            client.PhoneNumber = model.PhoneNumber;
            client.Address = model.Address;
            client.IdNumber = model.IdNumber;
            client.Type = model.Type;
            client.CompanyName = model.CompanyName;
            client.TaxId = model.TaxId;
            client.Notes = model.Notes;

            // Validate if corporate client has company name
            if (client.Type == ClientType.Corporate && string.IsNullOrWhiteSpace(client.CompanyName))
            {
                return BadRequest("Company name is required for corporate clients");
            }

            try
            {
                await _context.SaveChangesAsync();
                _logger.LogInformation("Client updated: {ClientId}", client.ClientId);
            }
            catch (DbUpdateConcurrencyException ex)
            {
                if (!ClientExists(id))
                {
                    return NotFound();
                }
                else
                {
                    _logger.LogError(ex, "Concurrency error updating client {ClientId}", id);
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating client {ClientId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the client", error = ex.Message });
            }

            return NoContent();
        }

        // DELETE: api/Clients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(int id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            try
            {
                // Soft delete
                client.IsActive = false;
                _context.Entry(client).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                _logger.LogInformation("Client soft deleted: {ClientId}", client.ClientId);

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting client {ClientId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the client", error = ex.Message });
            }
        }

        // GET: api/Clients/5/Cases
        [HttpGet("{id}/Cases")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Cases.Case>>> GetClientCases(int id)
        {
            if (!ClientExists(id))
            {
                return NotFound();
            }

            var clientCases = await _context.Cases
                .Where(c => c.Case_Clients.Any(cc => cc.ClientId == id))
                .ToListAsync();

            return clientCases;
        }

        // GET: api/Clients/5/Appointments
        [HttpGet("{id}/Appointments")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Appointments.Appointment>>> GetClientAppointments(int id)
        {
            if (!ClientExists(id))
            {
                return NotFound();
            }

            var appointments = await _context.Appointments
                .Where(a => a.ClientId == id)
                .OrderByDescending(a => a.StartTime)
                .ToListAsync();

            return appointments;
        }

        // GET: api/Clients/5/Invoices
        [HttpGet("{id}/Invoices")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Invoices.Invoice>>> GetClientInvoices(int id)
        {
            if (!ClientExists(id))
            {
                return NotFound();
            }

            var invoices = await _context.Invoices
                .Where(i => i.ClientId == id)
                .OrderByDescending(i => i.IssueDate)
                .ToListAsync();

            return invoices;
        }

        private bool ClientExists(int id)
        {
            return _context.Clients.Any(e => e.ClientId == id);
        }
    }

    // DTOs for client operations
    public class ClientCreateModel
    {
        [Required]
        public int LawFirmId { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        [StringLength(20)]
        public string IdNumber { get; set; }

        public ClientType Type { get; set; } = ClientType.Individual;

        [StringLength(200)]
        public string CompanyName { get; set; }

        [StringLength(50)]
        public string TaxId { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }
    }

    public class ClientUpdateModel
    {
        [Required]
        public int ClientId { get; set; }

        [Required]
        [StringLength(100)]
        public string FirstName { get; set; }

        [Required]
        [StringLength(100)]
        public string LastName { get; set; }

        [StringLength(100)]
        [EmailAddress]
        public string Email { get; set; }

        [StringLength(20)]
        public string PhoneNumber { get; set; }

        [StringLength(500)]
        public string Address { get; set; }

        [StringLength(20)]
        public string IdNumber { get; set; }

        public ClientType Type { get; set; }

        [StringLength(200)]
        public string CompanyName { get; set; }

        [StringLength(50)]
        public string TaxId { get; set; }

        [StringLength(1000)]
        public string Notes { get; set; }
    }
}