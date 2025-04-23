using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.Invoices;
using Shared_Models.TimeEntries;
using Shared_Models.Users;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace React_Lawyer.Server.Controllers.Invoices
{
    [Route("api/[controller]")]
    [ApiController]
    public class TimeEntriesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<TimeEntriesController> _logger;

        public TimeEntriesController(ApplicationDbContext context, ILogger<TimeEntriesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/TimeEntries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntries()
        {
            try
            {
                var entries = await _context.TimeEntries
                    .Include(t => t.Lawyer)
                        .ThenInclude(l => l.User)
                    .Include(t => t.Client)
                    .Include(t => t.Case)
                    .OrderByDescending(t => t.ActivityDate)
                    .Select(x => new
                    {
                        x.TimeEntryId,
                        x.LawyerId,
                        x.ClientId,
                        x.CaseId,
                        x.ActivityDate,
                        x.DurationMinutes,
                        x.Description,
                        x.IsBillable,
                        x.HourlyRate,
                        x.IsBilled,
                        x.InvoiceId,
                        x.LawFirmId,
                        x.CreatedAt,
                        x.LastModified,
                        Lawyer = new
                        {
                            x.Lawyer.LawyerId,
                            x.Lawyer.UserId,
                            User = x.Lawyer.User != null ? new
                            {
                                x.Lawyer.User.FirstName,
                                x.Lawyer.User.LastName,
                                x.Lawyer.User.Email
                            } : null
                        },
                        Client = x.Client != null ? new
                        {
                            x.Client.ClientId,
                            x.Client.FirstName,
                            x.Client.LastName,
                            x.Client.Email,
                            x.Client.PhoneNumber,
                            Type = x.Client.Type.ToString()
                        } : null,
                        Case = x.Case != null ? new
                        {
                            x.Case.CaseId,
                            x.Case.Title,
                            x.Case.CaseNumber,
                            Status = x.Case.Status.ToString(),
                            Type = x.Case.Type.ToString()
                        } : null
                    })
                    .ToListAsync();

                return entries;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting time entries");
                return StatusCode(500, "An error occurred while retrieving time entries.");
            }
        }

        // GET: api/TimeEntries/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetTimeEntry(int id)
        {
            var timeEntry = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .FirstOrDefaultAsync(t => t.TimeEntryId == id);

            if (timeEntry == null)
            {
                return NotFound();
            }

            return timeEntry;
        }

        // GET: api/TimeEntries/ByLawyer/{lawyerId}
        [HttpGet("ByLawyer/{lawyerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntriesByLawyer(int lawyerId)
        {
            var entries = await _context.TimeEntries
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Where(t => t.LawyerId == lawyerId)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/ByClient/{clientId}
        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntriesByClient(int clientId)
        {
            var entries = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Case)
                .Where(t => t.ClientId == clientId)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/ByCase/{caseId}
        [HttpGet("ByCase/{caseId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntriesByCase(int caseId)
        {
            var entries = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Where(t => t.CaseId == caseId)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntriesByFirm(int firmId)
        {
            var entries = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Where(t => t.LawFirmId == firmId)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/ByDate?startDate=2023-01-01&endDate=2023-01-31
        [HttpGet("ByDate")]
        public async Task<ActionResult<IEnumerable<object>>> GetTimeEntriesByDateRange([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            // Set time components to get full day coverage
            startDate = startDate.Date;
            endDate = endDate.Date.AddDays(1).AddSeconds(-1);

            var entries = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Where(t => t.ActivityDate >= startDate && t.ActivityDate <= endDate)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/Unbilled
        [HttpGet("Unbilled")]
        public async Task<ActionResult<IEnumerable<object>>> GetUnbilledTimeEntries()
        {
            // Get user ID from token claims
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            // Check if user is lawyer to filter entries, or admin/partner to see all
            var user = await _context.Users.FindAsync(int.Parse(userId));

            var query = _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Where(t => t.IsBillable && !t.IsBilled);

            // If user is a lawyer, only show their time entries
            if (user.Role == UserRole.Lawyer)
            {
                var lawyer = await _context.Lawyers.FirstOrDefaultAsync(l => l.UserId == user.UserId);
                if (lawyer != null)
                {
                    query = query.Where(t => t.LawyerId == lawyer.LawyerId);
                }
            }

            var entries = await query
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // GET: api/TimeEntries/Billed/{invoiceId}
        [HttpGet("Billed/{invoiceId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetBilledTimeEntries(int invoiceId)
        {
            var entries = await _context.TimeEntries
                .Include(t => t.Lawyer)
                    .ThenInclude(l => l.User)
                .Include(t => t.Client)
                .Include(t => t.Case)
                .Where(t => t.IsBilled && t.InvoiceId == invoiceId)
                .OrderByDescending(t => t.ActivityDate)
                .Select(x => new
                {
                    x.TimeEntryId,
                    x.LawyerId,
                    x.ClientId,
                    x.CaseId,
                    x.ActivityDate,
                    x.DurationMinutes,
                    x.Description,
                    x.IsBillable,
                    x.HourlyRate,
                    x.IsBilled,
                    x.InvoiceId,
                    x.LawFirmId,
                    x.CreatedAt,
                    x.LastModified,
                    Lawyer = new
                    {
                        x.Lawyer.LawyerId,
                        x.Lawyer.UserId,
                        User = x.Lawyer.User != null ? new
                        {
                            x.Lawyer.User.FirstName,
                            x.Lawyer.User.LastName,
                            x.Lawyer.User.Email
                        } : null
                    },
                    Client = x.Client != null ? new
                    {
                        x.Client.ClientId,
                        x.Client.FirstName,
                        x.Client.LastName,
                        x.Client.Email,
                        x.Client.PhoneNumber,
                        Type = x.Client.Type.ToString()
                    } : null,
                    Case = x.Case != null ? new
                    {
                        x.Case.CaseId,
                        x.Case.Title,
                        x.Case.CaseNumber,
                        Status = x.Case.Status.ToString(),
                        Type = x.Case.Type.ToString()
                    } : null
                })
                .ToListAsync();

            return entries;
        }

        // POST: api/TimeEntries
        [HttpPost]
        public async Task<ActionResult<TimeEntry>> CreateTimeEntry(TimeEntry_Create template)
        {
            try
            {
                // Get user ID from token claims
                string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized();
                }

                // Validate lawyer ID
                var lawyer = await _context.Lawyers.FindAsync(template.LawyerId);
                if (lawyer == null)
                {
                    return BadRequest("Invalid lawyer ID");
                }

                var timeEntry = new TimeEntry
                {
                    ActivityDate = template.ActivityDate,
                    DurationMinutes = template.DurationMinutes,
                    HourlyRate = template.HourlyRate,
                    Description = template.Description,
                    CaseId = template.CaseId,
                    ClientId = template.ClientId,
                    IsBillable = template.IsBillable,
                    IsBilled = false,
                    Category = TimeEntryCategory.Other,
                    CreatedAt = DateTime.UtcNow,
                    LawFirmId = template.LawFirmId,
                    InvoiceId = template.InvoiceId,
                    LastModified = DateTime.UtcNow,
                    LawyerId = lawyer.LawyerId
                };


                _context.TimeEntries.Add(timeEntry);
                await _context.SaveChangesAsync();

                return Ok( new object());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating time entry");
                return StatusCode(500, "An error occurred while creating the time entry.");
            }
        }

        // PUT: api/TimeEntries/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTimeEntry(int id, TimeEntry timeEntry)
        {
            if (id != timeEntry.TimeEntryId)
            {
                return BadRequest();
            }

            // Get user ID from token claims
            string userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            try
            {
                // Get existing entry to check if it's already billed
                var existingEntry = await _context.TimeEntries.FindAsync(id);
                if (existingEntry == null)
                {
                    return NotFound();
                }

                // Cannot edit a billed time entry
                if (existingEntry.IsBilled)
                {
                    return BadRequest("Cannot edit a time entry that has already been billed.");
                }

                // Update the entry
                existingEntry.LawyerId = timeEntry.LawyerId;
                existingEntry.ClientId = timeEntry.ClientId;
                existingEntry.CaseId = timeEntry.CaseId;
                existingEntry.ActivityDate = timeEntry.ActivityDate;
                existingEntry.DurationMinutes = timeEntry.DurationMinutes;
                existingEntry.Description = timeEntry.Description;
                existingEntry.IsBillable = timeEntry.IsBillable;
                existingEntry.HourlyRate = timeEntry.HourlyRate;
                existingEntry.LastModified = DateTime.UtcNow;

                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!TimeEntryExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating time entry");
                return StatusCode(500, "An error occurred while updating the time entry.");
            }

            return NoContent();
        }

        // DELETE: api/TimeEntries/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTimeEntry(int id)
        {
            var timeEntry = await _context.TimeEntries.FindAsync(id);
            if (timeEntry == null)
            {
                return NotFound();
            }

            // Cannot delete a billed time entry
            if (timeEntry.IsBilled)
            {
                return BadRequest("Cannot delete a time entry that has already been billed.");
            }

            _context.TimeEntries.Remove(timeEntry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PATCH: api/TimeEntries/MarkAsBilled
        [HttpPatch("MarkAsBilled")]
        public async Task<IActionResult> MarkTimeEntriesAsBilled([FromBody] MarkAsBilledModel model)
        {
            if (model == null || model.TimeEntryIds == null || model.TimeEntryIds.Count == 0 || model.InvoiceId <= 0)
            {
                return BadRequest("Invalid request data");
            }

            try
            {
                var entries = await _context.TimeEntries
                    .Where(t => model.TimeEntryIds.Contains(t.TimeEntryId) && t.IsBillable && !t.IsBilled)
                    .ToListAsync();

                if (entries.Count == 0)
                {
                    return NotFound("No valid time entries found to mark as billed");
                }

                // Update all entries
                foreach (var entry in entries)
                {
                    entry.IsBilled = true;
                    entry.InvoiceId = model.InvoiceId;
                    entry.LastModified = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = $"{entries.Count} time entries marked as billed" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking time entries as billed");
                return StatusCode(500, "An error occurred while marking time entries as billed.");
            }
        }

        // PATCH: api/TimeEntries/MarkAsUnbilled
        [HttpPatch("MarkAsUnbilled")]
        public async Task<IActionResult> MarkTimeEntriesAsUnbilled([FromBody] MarkAsUnbilledModel model)
        {
            if (model == null || model.TimeEntryIds == null || model.TimeEntryIds.Count == 0)
            {
                return BadRequest("Invalid request data");
            }

            try
            {
                var entries = await _context.TimeEntries
                    .Where(t => model.TimeEntryIds.Contains(t.TimeEntryId) && t.IsBilled)
                    .ToListAsync();

                if (entries.Count == 0)
                {
                    return NotFound("No valid time entries found to mark as unbilled");
                }

                // Update all entries
                foreach (var entry in entries)
                {
                    entry.IsBilled = false;
                    entry.InvoiceId = null;
                    entry.LastModified = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();

                return Ok(new { message = $"{entries.Count} time entries marked as unbilled" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking time entries as unbilled");
                return StatusCode(500, "An error occurred while marking time entries as unbilled.");
            }
        }

        private bool TimeEntryExists(int id)
        {
            return (_context.TimeEntries?.Any(e => e.TimeEntryId == id)).GetValueOrDefault();
        }
    }

    public class MarkAsBilledModel
    {
        public List<int> TimeEntryIds { get; set; }
        public int InvoiceId { get; set; }
    }

    public class MarkAsUnbilledModel
    {
        public List<int> TimeEntryIds { get; set; }
    }


    public class TimeEntry_Create
    {

        [Required]
        public int LawyerId { get; set; }

        public int? ClientId { get; set; }

        public int? CaseId { get; set; }

        [Required]
        public DateTime ActivityDate { get; set; }

        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Duration must be at least 1 minute")]
        public int DurationMinutes { get; set; }

        [Required]
        [StringLength(500)]
        public string Description { get; set; }



        public bool IsBillable { get; set; } = true;

        [Range(0, double.MaxValue)]
        public decimal HourlyRate { get; set; } = 0;

        public bool IsBilled { get; set; } = false;

        public int? InvoiceId { get; set; }

        public int? LawFirmId { get; set; }

    }
}
