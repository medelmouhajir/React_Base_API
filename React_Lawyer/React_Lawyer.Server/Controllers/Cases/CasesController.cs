using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Cases;
using Shared_Models.Clients;

namespace React_Lawyer.Server.Controllers.Cases
{
    [Route("api/[controller]")]
    [ApiController]
    public class CasesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CasesController> _logger;

        public CasesController(ApplicationDbContext context, ILogger<CasesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Cases
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Case>>> GetCases()
        {
            return await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .ToListAsync();
        }

        // GET: api/Cases/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Case>> GetCase(int id)
        {
            var @case = await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .Include(c => c.Documents)
                .Include(c => c.Case_Clients)
                    .ThenInclude(cc => cc.Client)
                .Include(c => c.Events)
                    .ThenInclude(e => e.CreatedBy)
                .Include(c => c.TimeEntries)
                .Include(c => c.Invoices)
                .FirstOrDefaultAsync(c => c.CaseId == id);

            if (@case == null)
            {
                return NotFound();
            }

            return @case;
        }

        // GET: api/Cases/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<Case>>> GetCasesByFirm(int firmId)
        {
            return await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .Where(c => c.LawFirmId == firmId)
                .ToListAsync();
        }

        // GET: api/Cases/ByLawyer/{lawyerId}
        [HttpGet("ByLawyer/{lawyerId}")]
        public async Task<ActionResult<IEnumerable<Case>>> GetCasesByLawyer(int lawyerId)
        {
            return await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .Where(c => c.LawyerId == lawyerId)
                .ToListAsync();
        }

        // GET: api/Cases/Active
        [HttpGet("Active")]
        public async Task<ActionResult<IEnumerable<Case>>> GetActiveCases()
        {
            return await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .Where(c => c.Status != CaseStatus.Closed && c.Status != CaseStatus.Archived)
                .ToListAsync();
        }

        // GET: api/Cases/Search?term={searchTerm}
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Case>>> SearchCases(string term)
        {
            if (string.IsNullOrWhiteSpace(term))
            {
                return await GetCases();
            }

            term = term.ToLower();
            return await _context.Cases
                .Include(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                .Where(c =>
                    c.CaseNumber.ToLower().Contains(term) ||
                    c.Title.ToLower().Contains(term) ||
                    c.Description.ToLower().Contains(term) ||
                    c.CourtCaseNumber.ToLower().Contains(term)
                )
                .ToListAsync();
        }

        // POST: api/Cases
        [HttpPost]
        public async Task<ActionResult<Case>> CreateCase(CaseCreateModel model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // Create the case
                var @case = new Case
                {
                    CaseNumber = model.CaseNumber,
                    LawFirmId = model.LawFirmId,
                    LawyerId = model.LawyerId,
                    Title = model.Title,
                    Description = model.Description,
                    Type = model.Type,
                    Status = CaseStatus.Intake,
                    OpenDate = DateTime.UtcNow,
                    CourtName = model.CourtName,
                    CourtCaseNumber = model.CourtCaseNumber,
                    OpposingParty = model.OpposingParty,
                    OpposingCounsel = model.OpposingCounsel,
                    NextHearingDate = model.NextHearingDate,
                    Notes = model.Notes,
                    IsUrgent = model.IsUrgent,
                    ParentCaseId = model.ParentCaseId
                };

                _context.Cases.Add(@case);
                await _context.SaveChangesAsync();

                // Add client associations
                if (model.ClientIds != null && model.ClientIds.Any())
                {
                    foreach (var clientId in model.ClientIds)
                    {
                        var caseClient = new Case_Client
                        {
                            CaseId = @case.CaseId,
                            ClientId = clientId
                        };
                        _context.Add(caseClient);
                    }
                    await _context.SaveChangesAsync();
                }

                // Create initial case event
                var caseEvent = new CaseEvent
                {
                    CaseId = @case.CaseId,
                    CreatedById = model.CreatedById,
                    Title = "Case Created",
                    Description = "Case has been created and is in intake stage.",
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.StatusChange,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetCase), new { id = @case.CaseId }, @case);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating case");
                return StatusCode(500, "An error occurred while creating the case.");
            }
        }

        // PUT: api/Cases/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCase(int id, Case @case)
        {
            if (id != @case.CaseId)
            {
                return BadRequest();
            }

            _context.Entry(@case).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CaseExists(id))
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

        // PATCH: api/Cases/5/Status
        [HttpPatch("{id}/Status")]
        public async Task<IActionResult> UpdateCaseStatus(int id, [FromBody] CaseStatusUpdateModel model)
        {
            var @case = await _context.Cases.FindAsync(id);
            if (@case == null)
            {
                return NotFound();
            }

            var oldStatus = @case.Status;
            @case.Status = model.NewStatus;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Entry(@case).State = EntityState.Modified;

                // Create case event for status change
                var caseEvent = new CaseEvent
                {
                    CaseId = id,
                    CreatedById = model.UserId,
                    Title = $"Status Changed: {oldStatus} → {model.NewStatus}",
                    Description = model.Notes,
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.StatusChange,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseEvents.Add(caseEvent);

                // If case is being closed, set close date
                if (model.NewStatus == CaseStatus.Closed || model.NewStatus == CaseStatus.Archived)
                {
                    @case.CloseDate = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating case status");
                return StatusCode(500, "An error occurred while updating the case status.");
            }
        }

        // DELETE: api/Cases/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCase(int id)
        {
            var @case = await _context.Cases.FindAsync(id);
            if (@case == null)
            {
                return NotFound();
            }

            // Check if this case has related cases
            var hasRelatedCases = await _context.Cases.AnyAsync(c => c.ParentCaseId == id);
            if (hasRelatedCases)
            {
                return BadRequest("Cannot delete a case with related cases.");
            }

            // Instead of hard delete, archive the case
            @case.Status = CaseStatus.Archived;
            @case.CloseDate = DateTime.UtcNow;

            _context.Entry(@case).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // GET: api/Cases/5/Documents
        [HttpGet("{id}/Documents")]
        public async Task<ActionResult<IEnumerable<Document>>> GetCaseDocuments(int id)
        {
            return await _context.Documents
                .Where(d => d.CaseId == id)
                .OrderByDescending(d => d.UploadDate)
                .ToListAsync();
        }

        // GET: api/Cases/5/Events
        [HttpGet("{id}/Events")]
        public async Task<ActionResult<IEnumerable<CaseEvent>>> GetCaseEvents(int id)
        {
            return await _context.CaseEvents
                .Include(e => e.CreatedBy)
                .Where(e => e.CaseId == id)
                .OrderByDescending(e => e.Date)
                .ToListAsync();
        }

        // POST: api/Cases/5/Events
        [HttpPost("{id}/Events")]
        public async Task<ActionResult<CaseEvent>> AddCaseEvent(int id, CaseEvent caseEvent)
        {
            if (id != caseEvent.CaseId)
            {
                return BadRequest();
            }

            caseEvent.CreatedAt = DateTime.UtcNow;
            _context.CaseEvents.Add(caseEvent);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCaseEvents", new { id = caseEvent.CaseEventId }, caseEvent);
        }

        // GET: api/Cases/5/Clients
        [HttpGet("{id}/Clients")]
        public async Task<ActionResult<IEnumerable<Client>>> GetCaseClients(int id)
        {
            var clientIds = await _context.Set<Case_Client>()
                .Where(cc => cc.CaseId == id)
                .Select(cc => cc.ClientId)
                .ToListAsync();

            return await _context.Clients
                .Where(c => clientIds.Contains(c.ClientId))
                .ToListAsync();
        }

        // POST: api/Cases/5/Clients
        [HttpPost("{id}/Clients")]
        public async Task<IActionResult> AddClientToCase(int id, [FromBody] int clientId)
        {
            // Check if case and client exist
            var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
            var clientExists = await _context.Clients.AnyAsync(c => c.ClientId == clientId);

            if (!caseExists || !clientExists)
            {
                return NotFound("Case or client not found.");
            }

            // Check if association already exists
            var associationExists = await _context.Set<Case_Client>()
                .AnyAsync(cc => cc.CaseId == id && cc.ClientId == clientId);

            if (associationExists)
            {
                return BadRequest("Client is already associated with this case.");
            }

            // Create the association
            var caseClient = new Case_Client
            {
                CaseId = id,
                ClientId = clientId
            };

            _context.Add(caseClient);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Cases/5/Clients/10
        [HttpDelete("{caseId}/Clients/{clientId}")]
        public async Task<IActionResult> RemoveClientFromCase(int caseId, int clientId)
        {
            var caseClient = await _context.Set<Case_Client>()
                .FirstOrDefaultAsync(cc => cc.CaseId == caseId && cc.ClientId == clientId);

            if (caseClient == null)
            {
                return NotFound();
            }

            _context.Remove(caseClient);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helper methods
        private bool CaseExists(int id)
        {
            return _context.Cases.Any(e => e.CaseId == id);
        }
    }

    public class CaseCreateModel
    {
        public string CaseNumber { get; set; }
        public int LawFirmId { get; set; }
        public int? LawyerId { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public CaseType Type { get; set; }
        public string CourtName { get; set; }
        public string CourtCaseNumber { get; set; }
        public string OpposingParty { get; set; }
        public string OpposingCounsel { get; set; }
        public DateTime? NextHearingDate { get; set; }
        public string Notes { get; set; }
        public bool IsUrgent { get; set; }
        public int? ParentCaseId { get; set; }
        public IEnumerable<int> ClientIds { get; set; }
        public int CreatedById { get; set; } // UserId creating the case
    }

    public class CaseStatusUpdateModel
    {
        public CaseStatus NewStatus { get; set; }
        public int UserId { get; set; } // User making the change
        public string Notes { get; set; }
    }
}