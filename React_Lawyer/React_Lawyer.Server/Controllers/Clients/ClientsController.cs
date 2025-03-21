using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Clients;

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
        public async Task<ActionResult<IEnumerable<Client>>> GetClients()
        {
            return await _context.Clients.Where(c => c.IsActive).ToListAsync();
        }

        // GET: api/Clients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Client>> GetClient(int id)
        {
            var client = await _context.Clients
                .Include(c => c.Cases)
                .Include(c => c.Appointments)
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.ClientId == id);

            if (client == null)
            {
                return NotFound();
            }

            return client;
        }

        // GET: api/Clients/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<Client>>> GetClientsByFirm(int firmId)
        {
            return await _context.Clients
                .Where(c => c.LawFirmId == firmId && c.IsActive)
                .ToListAsync();
        }

        // GET: api/Clients/Search?term={searchTerm}
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Client>>> SearchClients(string term)
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
                .ToListAsync();
        }

        // POST: api/Clients
        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient(Client client)
        {
            client.CreatedAt = DateTime.UtcNow;
            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClient), new { id = client.ClientId }, client);
        }

        // PUT: api/Clients/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(int id, Client client)
        {
            if (id != client.ClientId)
            {
                return BadRequest();
            }

            _context.Entry(client).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ClientExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
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

            // Soft delete
            client.IsActive = false;
            _context.Entry(client).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Clients/5/Cases
        [HttpGet("{id}/Cases")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Cases.Case>>> GetClientCases(int id)
        {
            var clientCases = await _context.Cases
                .Where(c => c.Case_Clients.Any(cc => cc.ClientId == id))
                .ToListAsync();

            return clientCases;
        }

        // GET: api/Clients/5/Appointments
        [HttpGet("{id}/Appointments")]
        public async Task<ActionResult<IEnumerable<Shared_Models.Appointments.Appointment>>> GetClientAppointments(int id)
        {
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
}