using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Services;
using Shared_Models.Clients;

namespace React_Lawyer.Server.Controllers.Cases
{
    [Route("api/[controller]")]
    [ApiController]
    public class PortalController : ControllerBase
    {
        private readonly ICaseScraperService _scraper;

        public PortalController(ICaseScraperService scraper)
        {
            _scraper = scraper;
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

    }
}
