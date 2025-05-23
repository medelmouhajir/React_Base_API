using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Lawyer.Server.Data;
using Shared_Models.Juridictions;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace React_Lawyer.Server.Controllers.Juridictions
{
    [Route("api/[controller]")]
    [ApiController]
    public class JuridictionsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<JuridictionsController> _logger;

        public JuridictionsController(ApplicationDbContext context, ILogger<JuridictionsController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/Juridictions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Juridiction>>> GetJuridictions()
        {
            try
            {
                _logger.LogInformation("Fetching all jurisdictions");
                return await _context.Juridictions.ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all jurisdictions");
                return StatusCode(500, new { message = "An error occurred while fetching jurisdictions" });
            }
        }

        // GET: api/Juridictions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Juridiction>> GetJuridiction(int id)
        {
            try
            {
                _logger.LogInformation("Fetching jurisdiction with ID: {JuridictionId}", id);

                var juridiction = await _context.Juridictions.FindAsync(id);

                if (juridiction == null)
                {
                    _logger.LogWarning("Jurisdiction with ID {JuridictionId} not found", id);
                    return NotFound();
                }

                return juridiction;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching jurisdiction with ID: {JuridictionId}", id);
                return StatusCode(500, new { message = "An error occurred while fetching the jurisdiction" });
            }
        }

        // GET: api/Juridictions/ByCode/{code}
        [HttpGet("ByCode/{code}")]
        public async Task<ActionResult<Juridiction>> GetJuridictionByCode(string code)
        {
            try
            {
                if (string.IsNullOrEmpty(code))
                {
                    return BadRequest("Code cannot be empty");
                }

                _logger.LogInformation("Fetching jurisdiction with code: {Code}", code);

                var juridiction = await _context.Juridictions
                    .FirstOrDefaultAsync(j => j.Code == code);

                if (juridiction == null)
                {
                    _logger.LogWarning("Jurisdiction with code {Code} not found", code);
                    return NotFound();
                }

                return juridiction;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching jurisdiction with code: {Code}", code);
                return StatusCode(500, new { message = "An error occurred while fetching the jurisdiction" });
            }
        }

        // POST: api/Juridictions
        [HttpPost]
        public async Task<ActionResult<Juridiction>> CreateJuridiction(Juridiction juridiction)
        {
            try
            {
                _logger.LogInformation("Creating new jurisdiction: {Name}", juridiction.Name);

                // Validate input
                if (string.IsNullOrEmpty(juridiction.Name))
                {
                    return BadRequest("Jurisdiction name is required");
                }

                if (string.IsNullOrEmpty(juridiction.Code))
                {
                    return BadRequest("Jurisdiction code is required");
                }

                // Check if the code already exists
                bool codeExists = await _context.Juridictions.AnyAsync(j => j.Code == juridiction.Code);
                if (codeExists)
                {
                    return BadRequest(new { message = $"A jurisdiction with code '{juridiction.Code}' already exists" });
                }

                _context.Juridictions.Add(juridiction);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetJuridiction), new { id = juridiction.Id }, juridiction);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating jurisdiction");
                return StatusCode(500, new { message = "An error occurred while creating the jurisdiction" });
            }
        }

        // PUT: api/Juridictions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJuridiction(int id, Juridiction juridiction)
        {
            try
            {
                if (id != juridiction.Id)
                {
                    return BadRequest("ID mismatch");
                }

                _logger.LogInformation("Updating jurisdiction with ID: {JuridictionId}", id);

                // Check if the jurisdiction exists
                var existingJuridiction = await _context.Juridictions.FindAsync(id);
                if (existingJuridiction == null)
                {
                    _logger.LogWarning("Jurisdiction with ID {JuridictionId} not found", id);
                    return NotFound();
                }

                // Check if the code is being changed to one that already exists
                if (existingJuridiction.Code != juridiction.Code)
                {
                    bool codeExists = await _context.Juridictions
                        .AnyAsync(j => j.Code == juridiction.Code && j.Id != id);

                    if (codeExists)
                    {
                        return BadRequest(new { message = $"A jurisdiction with code '{juridiction.Code}' already exists" });
                    }
                }

                // Update the properties
                existingJuridiction.Name = juridiction.Name;
                existingJuridiction.Code = juridiction.Code;
                existingJuridiction.Portal_Identifier = juridiction.Portal_Identifier;

                try
                {
                    await _context.SaveChangesAsync();
                }
                catch (DbUpdateConcurrencyException ex)
                {
                    if (!JuridictionExists(id))
                    {
                        _logger.LogWarning("Jurisdiction with ID {JuridictionId} not found during update", id);
                        return NotFound();
                    }
                    else
                    {
                        _logger.LogError(ex, "Concurrency error updating jurisdiction with ID: {JuridictionId}", id);
                        throw;
                    }
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating jurisdiction with ID: {JuridictionId}", id);
                return StatusCode(500, new { message = "An error occurred while updating the jurisdiction" });
            }
        }

        // DELETE: api/Juridictions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJuridiction(int id)
        {
            try
            {
                _logger.LogInformation("Deleting jurisdiction with ID: {JuridictionId}", id);

                var juridiction = await _context.Juridictions.FindAsync(id);
                if (juridiction == null)
                {
                    _logger.LogWarning("Jurisdiction with ID {JuridictionId} not found", id);
                    return NotFound();
                }

                // Check if the jurisdiction is being used by any cases before deleting
                bool isInUse = await _context.Cases.AnyAsync(c => c.JuridictionId == juridiction.Id);
                if (isInUse)
                {
                    return BadRequest(new { message = "Cannot delete jurisdiction as it is being used by one or more cases" });
                }

                _context.Juridictions.Remove(juridiction);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting jurisdiction with ID: {JuridictionId}", id);
                return StatusCode(500, new { message = "An error occurred while deleting the jurisdiction" });
            }
        }

        // GET: api/Juridictions/Search?term={searchTerm}
        [HttpGet("Search")]
        public async Task<ActionResult<IEnumerable<Juridiction>>> SearchJuridictions(string term)
        {
            try
            {
                if (string.IsNullOrEmpty(term))
                {
                    return await GetJuridictions();
                }

                _logger.LogInformation("Searching jurisdictions with term: {SearchTerm}", term);

                term = term.ToLower();
                var results = await _context.Juridictions
                    .Where(j => j.Name.ToLower().Contains(term) || j.Code.ToLower().Contains(term))
                    .ToListAsync();

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching jurisdictions with term: {SearchTerm}", term);
                return StatusCode(500, new { message = "An error occurred while searching jurisdictions" });
            }
        }

        private bool JuridictionExists(int id)
        {
            return _context.Juridictions.Any(e => e.Id == id);
        }
    }
}