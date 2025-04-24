using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using React_Lawyer.Server.Services;
using Shared_Models.Cases;
using Shared_Models.Clients;

namespace React_Lawyer.Server.Controllers.Cases
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortalController : ControllerBase
    {
        private readonly ICaseScraperService _scraper;
        private readonly ApplicationDbContext _context;
        private readonly ILogger<CasesController> _logger;

        public PortalController(ICaseScraperService scraper, ApplicationDbContext context, ILogger<CasesController> logger)
        {
            _scraper = scraper;
            _context = context;
            _logger = logger;
        }



        // POST: api/Cases/5/LinkPortalCase
        [HttpPost("{id}/LinkPortalCase")]
        public async Task<IActionResult> LinkPortalCase(int id)
        {
            try
            {

                var @case = await _context.Cases.FindAsync(id);
                if (@case == null)
                {
                    return NotFound(new { message = "Case not found" });
                }

                // Update court case number and other relevant fields
                //@case.CourtCaseNumber = model.PortalCaseNumber;
                //@case.CourtName = model.CourtName;
                //// Add additional fields as needed

                //// Create case event for linking
                //var caseEvent = new CaseEvent
                //{
                //    CaseId = id,
                //    CreatedById = GetCurrentUserId(),
                //    Title = "Linked to Tribunal Portal",
                //    Description = $"Case linked to tribunal portal case: {model.PortalCaseNumber}",
                //    Date = DateTime.UtcNow,
                //    EventType = CaseEventType.Other,
                //    CreatedAt = DateTime.UtcNow
                //};

                //_context.CaseEvents.Add(caseEvent);
                //_context.Entry(@case).State = EntityState.Modified;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Case successfully linked to portal" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking case {CaseId} to portal", id);
                return StatusCode(500, new { message = "An error occurred while linking the case to the portal" });
            }
        }


        [HttpGet("{id}")]
        public async Task<ActionResult<object>> Details(string id)
        {
            try
            {
                var caseInfo = await _scraper.GetCaseDataAsync(id);
                return Ok(caseInfo);
            }
            catch (Exception e)
            {

                throw;
            }
        }

        [HttpGet("decisions/{id}/{affaire}")]
        public async Task<ActionResult<object>> Decisions(string id, string affaire)
        {
            try
            {
                var caseInfo = await _scraper.GetCaseListDicisionsAsync(id, affaire);
                return Ok(caseInfo);
            }
            catch (Exception e)
            {
                // Optionally log e here
                return StatusCode(500, "Internal server error");
            }
        }

        [HttpGet("parties/{id}/{affaire}")]
        public async Task<ActionResult<object>> Parties(string id, string affaire)
        {
            try
            {
                var caseInfo = await _scraper.GetCaseListPartiesAsync(id, affaire);
                return Ok(caseInfo);
            }
            catch (Exception e)
            {
                // Optionally log e here
                return StatusCode(500, "Internal server error");
            }
        }

        private int GetCurrentUserId()
        {
            // In a real application, this would get the user ID from claims
            // For now, return a placeholder value or extract from token
            return 1; // Placeholder
        }
    }
}
