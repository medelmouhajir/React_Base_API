using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Notifications;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

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
            try
            {
                _logger.LogInformation("Fetching all cases");

                var cases = await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                        .Select(c => new Case
                        {
                            CaseId = c.CaseId,
                            CaseNumber = c.CaseNumber,
                            LawFirmId = c.LawFirmId,
                            LawyerId = c.LawyerId,
                            Title = c.Title,
                            Description = c.Description,
                            Type = c.Type,
                            Status = c.Status,
                            OpenDate = c.OpenDate,
                            CloseDate = c.CloseDate,
                            CourtName = c.CourtName,
                            CourtCaseNumber = c.CourtCaseNumber,
                            OpposingParty = c.OpposingParty,
                            OpposingCounsel = c.OpposingCounsel,
                            NextHearingDate = c.NextHearingDate,
                            Notes = c.Notes,
                            IsUrgent = c.IsUrgent,
                            ParentCaseId = c.ParentCaseId
                        })
                    .ToListAsync();

                return cases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all cases");
                return StatusCode(500, new { message = "An error occurred while fetching cases" });
            }
        }

        // GET: api/Cases/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Case>> GetCase(int id)
        {
            try
            {
                _logger.LogInformation("Fetching case with ID: {CaseId}", id);
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
                    _logger.LogWarning("Case with ID {CaseId} not found", id);
                    return NotFound();
                }

                return new Case
                {
                    CaseId = @case.CaseId,
                    CaseNumber = @case.CaseNumber,
                    LawFirmId = @case.LawFirmId,
                    LawyerId = @case.LawyerId,
                    Title = @case.Title,
                    Description = @case.Description,
                    Type = @case.Type,
                    Status = @case.Status,
                    OpenDate = @case.OpenDate,
                    CloseDate = @case.CloseDate,
                    CourtName = @case.CourtName,
                    CourtCaseNumber = @case.CourtCaseNumber,
                    OpposingParty = @case.OpposingParty,
                    OpposingCounsel = @case.OpposingCounsel,
                    NextHearingDate = @case.NextHearingDate,
                    Notes = @case.Notes,
                    IsUrgent = @case.IsUrgent,
                    ParentCaseId = @case.ParentCaseId,
                    AssignedLawyer = new Shared_Models.Users.Lawyer
                    {
                        LawyerId = @case.AssignedLawyer.LawyerId,
                        User = new Shared_Models.Users.User
                        {
                            FirstName = @case.AssignedLawyer.User.FirstName,
                            LastName = @case.AssignedLawyer.User.LastName
                        }
                    },
                    ActualSettlement = @case.ActualSettlement,
                    Case_Clients = @case.Case_Clients.Select(cc => new Case_Client
                    {
                        CaseId = cc.CaseId,
                        ClientId = cc.ClientId,
                        Client = new Client
                        {
                            ClientId = cc.Client.ClientId,
                            FirstName = cc.Client.FirstName,
                            LastName = cc.Client.LastName,
                            Email = cc.Client.Email,
                            PhoneNumber = cc.Client.PhoneNumber
                        }
                    }).ToList(),
                    Documents = @case.Documents.Select(x=> new Document
                    {
                        DocumentId = x.DocumentId,
                        CaseId = x.CaseId,
                        FileSize = x.FileSize,
                        FileType = x.FileType,
                        UploadDate = x.UploadDate
                    }).ToList(),
                    ExpectedSettlement = @case.ExpectedSettlement,
                    Invoices = @case.Invoices.Select(x => new Shared_Models.Invoices.Invoice
                    {
                        InvoiceId = x.InvoiceId,
                        CaseId = x.CaseId,
                        DueDate = x.DueDate,
                        IssueDate = x.IssueDate,
                        InvoiceNumber = x.InvoiceNumber,
                        Status = x.Status,
                        Amount = x.Amount,
                        PaidAmount = x.PaidAmount,
                        TaxAmount = x.TaxAmount
                    }
                    ).ToList(),
                    Events = @case.Events.Select(x=> new CaseEvent
                    {
                        CaseEventId = x.CaseEventId,
                        CaseId = x.CaseId,
                        CreatedAt = x.CreatedAt,
                        Date = x.Date,
                        Description = x.Description,
                        EventType = x.EventType,
                        IsImportant = x.IsImportant,
                        Location = x.Location,
                        Outcome = x.Outcome,
                    }).ToList(),
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the case" });
            }
        }

        // GET: api/Cases/ByFirm/{firmId}
        [HttpGet("ByFirm/{firmId}")]
        public async Task<ActionResult<IEnumerable<Case>>> GetCasesByFirm(int firmId)
        {
            try
            {
                _logger.LogInformation("Fetching cases for firm ID: {FirmId}", firmId);

                var cases = await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                        .Select(c => new Case
                        {
                            CaseId = c.CaseId,
                            CaseNumber = c.CaseNumber,
                            LawFirmId = c.LawFirmId,
                            LawyerId = c.LawyerId,
                            Title = c.Title,
                            Description = c.Description,
                            Type = c.Type,
                            Status = c.Status,
                            OpenDate = c.OpenDate,
                            CloseDate = c.CloseDate,
                            CourtName = c.CourtName,
                            CourtCaseNumber = c.CourtCaseNumber,
                            OpposingParty = c.OpposingParty,
                            OpposingCounsel = c.OpposingCounsel,
                            NextHearingDate = c.NextHearingDate,
                            Notes = c.Notes,
                            IsUrgent = c.IsUrgent,
                            ParentCaseId = c.ParentCaseId,
                            AssignedLawyer = new Shared_Models.Users.Lawyer
                            {
                                LawyerId = c.AssignedLawyer.LawyerId,
                                User = new Shared_Models.Users.User
                                {
                                    FirstName = c.AssignedLawyer.User.FirstName,
                                    LastName = c.AssignedLawyer.User.LastName,
                                }
                            }
                        })
                    .Where(c => c.LawFirmId == firmId)
                    .ToListAsync();

                return cases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching cases for firm ID: {FirmId}", firmId);
                return StatusCode(500, new { message = "An error occurred while fetching firm cases" });
            }
        }

        [HttpGet("ByClient/{clientId}")]
        public async Task<ActionResult<IEnumerable<Case>>> GetCasesByClient(int clientId)
        {
            try
            {
                _logger.LogInformation("Fetching cases for client ID: {ClientId}", clientId);

                var cases = await _context.Clients
                    .Include(x=> x.Case_Clients)
                    .ThenInclude(x=> x.Case)
                    .ThenInclude(c => c.AssignedLawyer)
                    .ThenInclude(l => l.User)
                    .Where(c => c.ClientId == clientId)
                    .SelectMany(x=> x.Case_Clients.Select(c=> c.Case))
                        .Select(c => new Case
                        {
                            CaseId = c.CaseId,
                            CaseNumber = c.CaseNumber,
                            LawFirmId = c.LawFirmId,
                            LawyerId = c.LawyerId,
                            Title = c.Title,
                            Description = c.Description,
                            Type = c.Type,
                            Status = c.Status,
                            OpenDate = c.OpenDate,
                            CloseDate = c.CloseDate,
                            CourtName = c.CourtName,
                            CourtCaseNumber = c.CourtCaseNumber,
                            OpposingParty = c.OpposingParty,
                            OpposingCounsel = c.OpposingCounsel,
                            NextHearingDate = c.NextHearingDate,
                            Notes = c.Notes,
                            IsUrgent = c.IsUrgent,
                            ParentCaseId = c.ParentCaseId,
                            AssignedLawyer = new Shared_Models.Users.Lawyer
                            {
                                LawyerId = c.AssignedLawyer.LawyerId,
                                User = new Shared_Models.Users.User
                                {
                                    FirstName = c.AssignedLawyer.User.FirstName,
                                    LastName = c.AssignedLawyer.User.LastName,
                                }
                            }
                        })
                    .ToListAsync();

                return cases;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching cases for client ID: {ClientId}", clientId);
                return StatusCode(500, new { message = "An error occurred while fetching client cases" });
            }
        }

        // GET: api/Cases/ByLawyer/{lawyerId}
        [HttpGet("ByLawyer/{lawyerId}")]
        public async Task<ActionResult<IEnumerable<Case>>> GetCasesByLawyer(int lawyerId)
        {
            try
            {
                _logger.LogInformation("Fetching cases for lawyer ID: {LawyerId}", lawyerId);
                return await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                    .Where(c => c.LawyerId == lawyerId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching cases for lawyer ID: {LawyerId}", lawyerId);
                return StatusCode(500, new { message = "An error occurred while fetching lawyer cases" });
            }
        }

        // GET: api/Cases/Active
        [HttpGet("Active")]
        public async Task<ActionResult<IEnumerable<Case>>> GetActiveCases()
        {
            try
            {
                _logger.LogInformation("Fetching active cases");
                return await _context.Cases
                    .Include(c => c.AssignedLawyer)
                        .ThenInclude(l => l.User)
                    .Where(c => c.Status != CaseStatus.Closed && c.Status != CaseStatus.Archived)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching active cases");
                return StatusCode(500, new { message = "An error occurred while fetching active cases" });
            }
        }

        // GET: api/Cases/Search?term={searchTerm}
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Case>>> SearchCases(string term)
        {
            try
            {
                _logger.LogInformation("Searching cases with term: {SearchTerm}", term);

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
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching cases with term: {SearchTerm}", term);
                return StatusCode(500, new { message = "An error occurred while searching cases" });
            }
        }

        // POST: api/Cases
        [HttpPost]
        public async Task<ActionResult<Case>> CreateCase(CaseCreateModel model)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _logger.LogInformation("Creating new case: {CaseTitle}", model.title);

                // Validate model
                if (string.IsNullOrWhiteSpace(model.title))
                {
                    return BadRequest(new { message = "Case title is required" });
                }

                if (string.IsNullOrWhiteSpace(model.description))
                {
                    return BadRequest(new { message = "Case description is required" });
                }

                if (model.clientIds == null || !model.clientIds.Any())
                {
                    return BadRequest(new { message = "At least one client is required" });
                }

                // Generate case number if not provided
                string caseNumber = model.caseNumber;
                if (string.IsNullOrWhiteSpace(caseNumber))
                {
                    caseNumber = await GenerateCaseNumberAsync(model.lawFirmId);
                }

                // Create the case
                var @case = new Case
                {
                    CaseNumber = caseNumber,
                    LawFirmId = model.lawFirmId,
                    LawyerId = model.lawyerId,
                    Title = model.title,
                    Description = model.description,
                    Type = model.type,
                    Status = CaseStatus.Intake,
                    OpenDate = DateTime.UtcNow,
                    CourtName = model.courtName,
                    CourtCaseNumber = model.courtCaseNumber,
                    OpposingParty = model.opposingParty,
                    OpposingCounsel = model.opposingCounsel,
                    NextHearingDate = model.nextHearingDate,
                    Notes = model.notes,
                    IsUrgent = model.isUrgent,
                    ParentCaseId = model.parentCaseId
                };

                _context.Cases.Add(@case);
                await _context.SaveChangesAsync();

                // Add client associations
                if (model.clientIds != null && model.clientIds.Any())
                {
                    foreach (var clientId in model.clientIds)
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
                    CreatedById = model.createdById,
                    Title = "Case Created",
                    Description = "Case has been created and is in intake stage.",
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.StatusChange,
                    CreatedAt = DateTime.UtcNow,
                    Location = "",
                    Outcome = ""
                };

                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync();

                // Create notification for assigned lawyer if any
                if (model.lawyerId.HasValue)
                {
                    var lawyerUser = await _context.Lawyers
                        .Where(l => l.LawyerId == model.lawyerId)
                        .Select(l => l.UserId)
                        .FirstOrDefaultAsync();

                    if (lawyerUser != 0)
                    {
                        var notification = new Notification
                        {
                            UserId = lawyerUser,
                            Title = "New Case Assigned",
                            Message = $"You have been assigned to case: {model.title}",
                            Type = NotificationType.CaseAssignment,
                            CreatedAt = DateTime.UtcNow,
                            ActionUrl = $"/cases/{@case.CaseId}"
                        };

                        _context.Notifications.Add(notification);
                        await _context.SaveChangesAsync();
                    }
                }

                await transaction.CommitAsync();

                return CreatedAtAction(nameof(GetCase), new { id = @case.CaseId }, @case);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating case");
                return StatusCode(500, new { message = "An error occurred while creating the case" });
            }
        }

        // PUT: api/Cases/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCase(int id, Case @case)
        {
            if (id != @case.CaseId)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                _logger.LogInformation("Updating case with ID: {CaseId}", id);

                // Get the existing case to update only allowed fields
                var existingCase = await _context.Cases.FindAsync(id);
                if (existingCase == null)
                {
                    return NotFound(new { message = "Case not found" });
                }

                // Update allowed fields
                existingCase.Title = @case.Title;
                existingCase.Description = @case.Description;
                existingCase.LawyerId = @case.LawyerId;
                existingCase.Type = @case.Type;
                existingCase.CourtName = @case.CourtName;
                existingCase.CourtCaseNumber = @case.CourtCaseNumber;
                existingCase.OpposingParty = @case.OpposingParty;
                existingCase.OpposingCounsel = @case.OpposingCounsel;
                existingCase.NextHearingDate = @case.NextHearingDate;
                existingCase.Notes = @case.Notes;
                existingCase.IsUrgent = @case.IsUrgent;
                existingCase.ParentCaseId = @case.ParentCaseId;

                // Don't update sensitive fields like Status directly
                // Those should be updated through dedicated endpoints

                _context.Entry(existingCase).State = EntityState.Modified;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    if (!CaseExists(id))
                    {
                        return NotFound(new { message = "Case not found" });
                    }
                    else
                    {
                        _logger.LogError(ex, "Concurrency error updating case with ID: {CaseId}", id);
                        return StatusCode(500, new { message = "Concurrency error updating case" });
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the case" });
            }
        }

        // PATCH: api/Cases/5/Status
        [HttpPatch("{id}/Status")]
        public async Task<IActionResult> UpdateCaseStatus(int id, [FromBody] CaseStatusUpdateModel model)
        {
            try
            {
                _logger.LogInformation("Updating status for case with ID: {CaseId}", id);

                var @case = await _context.Cases.FindAsync(id);
                if (@case == null)
                {
                    return NotFound(new { message = "Case not found" });
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
                        CreatedAt = DateTime.UtcNow,
                        Location = "",
                        Outcome = "",
                    };

                    _context.CaseEvents.Add(caseEvent);

                    // If case is being closed, set close date
                    if (model.NewStatus == CaseStatus.Closed || model.NewStatus == CaseStatus.Archived)
                    {
                        @case.CloseDate = DateTime.UtcNow;
                    }

                    // Create notification for assigned lawyer
                    if (@case.LawyerId.HasValue)
                    {
                        var lawyerUser = await _context.Lawyers
                            .Where(l => l.LawyerId == @case.LawyerId)
                            .Select(l => l.UserId)
                            .FirstOrDefaultAsync();

                        if (lawyerUser != 0 && lawyerUser != model.UserId) // Don't notify if the user making the change is the lawyer
                        {
                            var notification = new Notification
                            {
                                UserId = lawyerUser,
                                Title = "Case Status Changed",
                                Message = $"Case {@case.CaseNumber} status changed to {model.NewStatus}",
                                Type = NotificationType.CaseStatusChange,
                                CreatedAt = DateTime.UtcNow,
                                ActionUrl = $"/cases/{id}"
                            };

                            _context.Notifications.Add(notification);
                        }
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    _logger.LogError(ex, "Error updating case status for ID: {CaseId}", id);
                    return StatusCode(500, new { message = "An error occurred while updating the case status" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating case status for ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the case status" });
            }
        }

        // DELETE: api/Cases/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCase(int id)
        {
            try
            {
                _logger.LogInformation("Deleting case with ID: {CaseId}", id);

                var @case = await _context.Cases.FindAsync(id);
                if (@case == null)
                {
                    return NotFound(new { message = "Case not found" });
                }

                // Check if this case has related cases
                var hasRelatedCases = await _context.Cases.AnyAsync(c => c.ParentCaseId == id);
                if (hasRelatedCases)
                {
                    return BadRequest(new { message = "Cannot delete a case with related cases" });
                }

                // Instead of hard delete, archive the case
                @case.Status = CaseStatus.Archived;
                @case.CloseDate = DateTime.UtcNow;

                // Create case event for archiving
                var caseEvent = new CaseEvent
                {
                    CaseId = id,
                    CreatedById = GetCurrentUserId(),
                    Title = "Case Archived",
                    Description = "Case has been archived by user.",
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.StatusChange,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseEvents.Add(caseEvent);
                _context.Entry(@case).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the case" });
            }
        }

        // GET: api/Cases/5/Documents
        [HttpGet("{id}/Documents")]
        public async Task<ActionResult<IEnumerable<Document>>> GetCaseDocuments(int id)
        {
            try
            {
                _logger.LogInformation("Fetching documents for case with ID: {CaseId}", id);

                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
                if (!caseExists)
                {
                    return NotFound(new { message = "Case not found" });
                }

                return await _context.Documents
                    .Where(d => d.CaseId == id)
                    .OrderByDescending(d => d.UploadDate)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching documents for case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching case documents" });
            }
        }

        // GET: api/Cases/5/Events
        [HttpGet("{id}/Events")]
        public async Task<ActionResult<IEnumerable<CaseEvent>>> GetCaseEvents(int id)
        {
            try
            {
                _logger.LogInformation("Fetching events for case with ID: {CaseId}", id);

                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
                if (!caseExists)
                {
                    return NotFound(new { message = "Case not found" });
                }

                return await _context.CaseEvents
                    .Include(e => e.CreatedBy)
                    .Where(e => e.CaseId == id)
                    .OrderByDescending(e => e.Date)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching events for case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching case events" });
            }
        }

        // POST: api/Cases/5/Events
        [HttpPost("{id}/Events")]
        public async Task<ActionResult<CaseEvent>> AddCaseEvent(int id, CaseEvent caseEvent)
        {
            if (id != caseEvent.CaseId)
            {
                return BadRequest(new { message = "ID mismatch" });
            }

            try
            {
                _logger.LogInformation("Adding event to case with ID: {CaseId}", id);

                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
                if (!caseExists)
                {
                    return NotFound(new { message = "Case not found" });
                }

                caseEvent.CreatedAt = DateTime.UtcNow;
                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync();

                return CreatedAtAction("GetCaseEvents", new { id = caseEvent.CaseEventId }, caseEvent);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding event to case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while adding the case event" });
            }
        }

        // GET: api/Cases/5/Clients
        [HttpGet("{id}/Clients")]
        public async Task<ActionResult<IEnumerable<Client>>> GetCaseClients(int id)
        {
            try
            {
                _logger.LogInformation("Fetching clients for case with ID: {CaseId}", id);

                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
                if (!caseExists)
                {
                    return NotFound(new { message = "Case not found" });
                }

                var clientIds = await _context.Set<Case_Client>()
                    .Where(cc => cc.CaseId == id)
                    .Select(cc => cc.ClientId)
                    .ToListAsync();

                return await _context.Clients
                    .Where(c => clientIds.Contains(c.ClientId))
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching clients for case with ID: {CaseId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching case clients" });
            }
        }

        // POST: api/Cases/5/Clients
        [HttpPost("{id}/Clients")]
        public async Task<IActionResult> AddClientToCase(int id, [FromBody] int clientId)
        {
            try
            {
                _logger.LogInformation("Adding client {ClientId} to case {CaseId}", clientId, id);

                // Check if case and client exist
                var caseExists = await _context.Cases.AnyAsync(c => c.CaseId == id);
                var clientExists = await _context.Clients.AnyAsync(c => c.ClientId == clientId);

                if (!caseExists || !clientExists)
                {
                    return NotFound(new { message = "Case or client not found" });
                }

                // Check if association already exists
                var associationExists = await _context.Set<Case_Client>()
                    .AnyAsync(cc => cc.CaseId == id && cc.ClientId == clientId);

                if (associationExists)
                {
                    return BadRequest(new { message = "Client is already associated with this case" });
                }

                // Create the association
                var caseClient = new Case_Client
                {
                    CaseId = id,
                    ClientId = clientId
                };

                _context.Add(caseClient);
                await _context.SaveChangesAsync();

                // Create a case event for adding client
                var caseEvent = new CaseEvent
                {
                    CaseId = id,
                    CreatedById = GetCurrentUserId(),
                    Title = "Client Added",
                    Description = $"Client has been added to the case.",
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.ClientAdded,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding client {ClientId} to case {CaseId}", clientId, id);
                return StatusCode(500, new { message = "An error occurred while adding the client to the case" });
            }
        }

        // DELETE: api/Cases/5/Clients/10
        [HttpDelete("{caseId}/Clients/{clientId}")]
        public async Task<IActionResult> RemoveClientFromCase(int caseId, int clientId)
        {
            try
            {
                _logger.LogInformation("Removing client {ClientId} from case {CaseId}", clientId, caseId);

                var caseClient = await _context.Set<Case_Client>()
                    .FirstOrDefaultAsync(cc => cc.CaseId == caseId && cc.ClientId == clientId);

                if (caseClient == null)
                {
                    return NotFound(new { message = "Client is not associated with this case" });
                }

                _context.Remove(caseClient);

                // Create a case event for removing client
                var caseEvent = new CaseEvent
                {
                    CaseId = caseId,
                    CreatedById = GetCurrentUserId(),
                    Title = "Client Removed",
                    Description = $"Client has been removed from the case.",
                    Date = DateTime.UtcNow,
                    EventType = CaseEventType.ClientRemoved,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CaseEvents.Add(caseEvent);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing client {ClientId} from case {CaseId}", clientId, caseId);
                return StatusCode(500, new { message = "An error occurred while removing the client from the case" });
            }
        }

        // Helper methods
        private bool CaseExists(int id)
        {
            return _context.Cases.Any(e => e.CaseId == id);
        }

        private async Task<string> GenerateCaseNumberAsync(int lawFirmId)
        {
            // Generate a unique case number in the format: FIRM-YEAR-SEQUENCE
            var year = DateTime.UtcNow.Year;
            var prefix = $"{lawFirmId:D3}-{year}";

            // Find the highest sequence number for this year and firm
            var lastCase = await _context.Cases
                .Where(c => c.CaseNumber.StartsWith(prefix))
                .OrderByDescending(c => c.CaseNumber)
                .FirstOrDefaultAsync();

            int sequence = 1;
            if (lastCase != null)
            {
                var parts = lastCase.CaseNumber.Split('-');
                if (parts.Length == 3 && int.TryParse(parts[2], out int lastSequence))
                {
                    sequence = lastSequence + 1;
                }
            }

            return $"{prefix}-{sequence:D5}";
        }

        private int GetCurrentUserId()
        {
            // In a real application, this would get the user ID from claims
            // For now, return a placeholder value or extract from token
            return 1; // Placeholder
        }
    }

    // Models for API requests and responses
    public class CaseCreateModel
    {
        public string caseNumber { get; set; }

        public int lawFirmId { get; set; }

        // Optional - Assigned lawyer ID
        public int? lawyerId { get; set; }

        public string title { get; set; }

        public string description { get; set; }

        // Required - Case type (enum)
        public CaseType type { get; set; }

        // Optional - Court information
        public string courtName { get; set; }
        public string courtCaseNumber { get; set; }
        public string opposingParty { get; set; }
        public string opposingCounsel { get; set; }

        // Optional - Next hearing date
        public DateTime? nextHearingDate { get; set; }

        // Optional - Notes
        public string notes { get; set; }

        // Optional - Urgency flag
        public bool isUrgent { get; set; }

        // Optional - Parent case ID for related cases
        public int? parentCaseId { get; set; }

        public IEnumerable<int> clientIds { get; set; }

        public int createdById { get; set; }
    }

    public class CaseStatusUpdateModel
    {
        public CaseStatus NewStatus { get; set; }
        public int UserId { get; set; } // User making the change
        public string Notes { get; set; }
    }
}