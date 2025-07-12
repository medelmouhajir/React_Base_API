using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Tickets;

namespace React_Rentify.Server.Controllers.Tickets
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class TicketsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<TicketsController> _logger;

        public TicketsController(MainDbContext context, ILogger<TicketsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// GET: api/Tickets
        /// Returns all tickets.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllTickets()
        {
            _logger.LogInformation("Retrieving all tickets");
            var tickets = await _context.Set<Ticket>()
                .OrderByDescending(t => t.Created_At)
                .ToListAsync();

            var dto = tickets.Select(t => new TicketDto
            {
                Id = t.Id,
                Name = t.Name,
                Phone = t.Phone,
                Object = t.Object,
                Message = t.Message,
                CreatedAt = t.Created_At,
                Status = t.Status
            });

            _logger.LogInformation("Retrieved {Count} tickets", tickets.Count);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Tickets/{id}
        /// Returns a single ticket by Id.
        /// </summary>
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetTicketById(int id)
        {
            _logger.LogInformation("Retrieving ticket with Id {TicketId}", id);
            var t = await _context.Set<Ticket>()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (t == null)
            {
                _logger.LogWarning("Ticket with Id {TicketId} not found", id);
                return NotFound(new { message = $"Ticket with Id '{id}' not found." });
            }

            var dto = new TicketDto
            {
                Id = t.Id,
                Name = t.Name,
                Phone = t.Phone,
                Object = t.Object,
                Message = t.Message,
                CreatedAt = t.Created_At,
                Status = t.Status
            };

            _logger.LogInformation("Retrieved ticket {TicketId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// POST: api/Tickets
        /// Creates a new ticket.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateTicket([FromBody] CreateTicketDto dto)
        {
            _logger.LogInformation("Creating a new ticket");
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateTicketDto received");
                return BadRequest(ModelState);
            }

            var ticket = new Ticket
            {
                Name = dto.Name,
                Phone = dto.Phone,
                Object = dto.Object,
                Message = dto.Message,
                Created_At = DateTime.UtcNow,
                Status = Ticket_Status.Created
            };

            _context.Set<Ticket>().Add(ticket);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created ticket {TicketId}", ticket.Id);
            var resultDto = new TicketDto
            {
                Id = ticket.Id,
                Name = ticket.Name,
                Phone = ticket.Phone,
                Object = ticket.Object,
                Message = ticket.Message,
                CreatedAt = ticket.Created_At,
                Status = ticket.Status
            };

            return CreatedAtAction(nameof(GetTicketById), new { id = ticket.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Tickets/{id}
        /// Updates an existing ticket.
        /// </summary>
        [HttpPut("{id:int}")]
        public async Task<IActionResult> UpdateTicket(int id, [FromBody] UpdateTicketDto dto)
        {
            _logger.LogInformation("Updating ticket {TicketId}", id);
            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateTicketDto for Ticket {TicketId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match payload Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "Id in URL does not match payload." });
            }

            var existing = await _context.Set<Ticket>()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (existing == null)
            {
                _logger.LogWarning("Ticket with Id {TicketId} not found", id);
                return NotFound(new { message = $"Ticket with Id '{id}' not found." });
            }

            existing.Name = dto.Name;
            existing.Phone = dto.Phone;
            existing.Object = dto.Object;
            existing.Message = dto.Message;
            existing.Status = dto.Status;

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated ticket {TicketId}", id);
            var resultDto = new TicketDto
            {
                Id = existing.Id,
                Name = existing.Name,
                Phone = existing.Phone,
                Object = existing.Object,
                Message = existing.Message,
                CreatedAt = existing.Created_At,
                Status = existing.Status
            };

            return Ok(resultDto);
        }

        /// <summary>
        /// DELETE: api/Tickets/{id}
        /// Deletes a ticket.
        /// </summary>
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteTicket(int id)
        {
            _logger.LogInformation("Deleting ticket {TicketId}", id);
            var t = await _context.Set<Ticket>()
                .FirstOrDefaultAsync(x => x.Id == id);

            if (t == null)
            {
                _logger.LogWarning("Ticket with Id {TicketId} not found", id);
                return NotFound(new { message = $"Ticket with Id '{id}' not found." });
            }

            _context.Set<Ticket>().Remove(t);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted ticket {TicketId}", id);
            return NoContent();
        }
    }

    #region DTOs

    public class TicketDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Object { get; set; }
        public string Message { get; set; }
        public DateTime CreatedAt { get; set; }
        public Ticket_Status Status { get; set; }
    }

    public class CreateTicketDto
    {
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Object { get; set; }
        public string Message { get; set; }
    }

    public class UpdateTicketDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Phone { get; set; }
        public string Object { get; set; }
        public string Message { get; set; }
        public Ticket_Status Status { get; set; }
    }

    #endregion
}
