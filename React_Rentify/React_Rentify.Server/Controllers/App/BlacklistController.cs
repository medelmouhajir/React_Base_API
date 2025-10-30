using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Blacklists;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin ,Owner,Manager")]
    public class BlacklistController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<BlacklistController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public BlacklistController(MainDbContext context, ILogger<BlacklistController> logger , IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Blacklist
        /// Returns all blacklist entries (DTO), including the reporting agency name.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllEntries()
        {
            _logger.LogInformation("Retrieving all blacklist entries");

            var entries = await _context.Set<Blacklist_Entry>()
                .Include(e => e.ReportedByAgency)
                .ToListAsync();

            var dtoList = entries.Select(e => new BlacklistEntryDto
            {
                Id = e.Id,
                NationalId = e.NationalId,
                PassportId = e.PassportId,
                LicenseNumber = e.LicenseNumber,
                FullName = e.FullName,
                Reason = e.Reason,
                DateAdded = e.DateAdded,
                ReportedByAgencyId = e.ReportedByAgencyId,
                ReportedByAgencyName = e.ReportedByAgency != null ? e.ReportedByAgency.Name : null
            }).ToList();

            _logger.LogInformation("Retrieved {Count} blacklist entries", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// GET: api/Blacklist/{id}
        /// Returns a single blacklist entry by Id (DTO).
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetEntryById(Guid id)
        {
            _logger.LogInformation("Retrieving blacklist entry with Id {EntryId}", id);

            var entry = await _context.Set<Blacklist_Entry>()
                .Include(e => e.ReportedByAgency)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entry == null)
            {
                _logger.LogWarning("Blacklist entry with Id {EntryId} not found", id);
                return NotFound(new { message = $"Blacklist entry with Id '{id}' not found." });
            }

            var dto = new BlacklistEntryDto
            {
                Id = entry.Id,
                NationalId = entry.NationalId,
                PassportId = entry.PassportId,
                LicenseNumber = entry.LicenseNumber,
                FullName = entry.FullName,
                Reason = entry.Reason,
                DateAdded = entry.DateAdded,
                ReportedByAgencyId = entry.ReportedByAgencyId,
                ReportedByAgencyName = entry.ReportedByAgency != null ? entry.ReportedByAgency.Name : null
            };

            _logger.LogInformation("Retrieved blacklist entry {EntryId}", id);
            return Ok(dto);
        }

        /// <summary>
        /// GET: api/Blacklist/search
        /// Search entries by NationalId, PassportId, or LicenseNumber.
        /// Provide one or more query parameters.
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchEntries(
            [FromQuery] string? nationalId,
            [FromQuery] string? passportId,
            [FromQuery] string? licenseNumber)
        {
            _logger.LogInformation(
                "Searching blacklist entries with NationalId='{NationalId}', PassportId='{PassportId}', LicenseNumber='{LicenseNumber}'",
                nationalId, passportId, licenseNumber);

            try
            {
                IQueryable<Blacklist_Entry> query = _context.Set<Blacklist_Entry>()
                    .Include(e => e.ReportedByAgency);

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

                var dtoList = results.Select(e => new BlacklistEntryDto
                {
                    Id = e.Id,
                    NationalId = e.NationalId,
                    PassportId = e.PassportId,
                    LicenseNumber = e.LicenseNumber,
                    FullName = e.FullName,
                    Reason = e.Reason,
                    DateAdded = e.DateAdded,
                    ReportedByAgencyId = e.ReportedByAgencyId,
                    ReportedByAgencyName = e.ReportedByAgency != null ? e.ReportedByAgency.Name : null
                }).ToList();

                _logger.LogInformation("Search returned {Count} entries", dtoList.Count);
                return Ok(dtoList);
            }
            catch (Exception e)
            { 
                return BadRequest(e);
            }
        }

        /// <summary>
        /// POST: api/Blacklist
        /// Creates a new blacklist entry. Accepts CreateBlacklistEntryDto.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateEntry([FromBody] CreateBlacklistEntryDto dto)
        {
            _logger.LogInformation("Creating new blacklist entry for {FullName}", dto.FullName);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateBlacklistEntryDto received");
                return BadRequest(ModelState);
            }

            if (!await _authService.HasAccessToAgencyAsync(dto.ReportedByAgencyId))
                return Unauthorized();

            // Verify the reporting agency exists
            var agencyExists = await _context.Set<Agency>()
                .AnyAsync(a => a.Id == dto.ReportedByAgencyId);

            if (!agencyExists)
            {
                _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.ReportedByAgencyId);
                return BadRequest(new { message = $"Agency with Id '{dto.ReportedByAgencyId}' does not exist." });
            }

            var entry = new Blacklist_Entry
            {
                Id = Guid.NewGuid(),
                NationalId = dto.NationalId,
                PassportId = dto.PassportId,
                LicenseNumber = dto.LicenseNumber,
                FullName = dto.FullName,
                Reason = dto.Reason,
                DateAdded = DateTime.UtcNow,
                ReportedByAgencyId = dto.ReportedByAgencyId
            };

            _context.Set<Blacklist_Entry>().Add(entry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created blacklist entry {EntryId}", entry.Id);

            var resultDto = new BlacklistEntryDto
            {
                Id = entry.Id,
                NationalId = entry.NationalId,
                PassportId = entry.PassportId,
                LicenseNumber = entry.LicenseNumber,
                FullName = entry.FullName,
                Reason = entry.Reason,
                DateAdded = entry.DateAdded,
                ReportedByAgencyId = entry.ReportedByAgencyId,
                ReportedByAgencyName = (await _context.Set<Agency>()
                    .Where(a => a.Id == entry.ReportedByAgencyId)
                    .Select(a => a.Name)
                    .FirstOrDefaultAsync())
            };

            return CreatedAtAction(nameof(GetEntryById), new { id = entry.Id }, resultDto);
        }

        /// <summary>
        /// PUT: api/Blacklist/{id}
        /// Updates an existing blacklist entry. Accepts UpdateBlacklistEntryDto.
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateEntry(Guid id, [FromBody] UpdateBlacklistEntryDto dto)
        {
            _logger.LogInformation("Updating blacklist entry {EntryId}", id);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid UpdateBlacklistEntryDto for Entry {EntryId}", id);
                return BadRequest(ModelState);
            }

            if (id != dto.Id)
            {
                _logger.LogWarning("URL Id {UrlId} does not match DTO Id {DtoId}", id, dto.Id);
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existing = await _context.Set<Blacklist_Entry>()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (existing == null)
            {
                _logger.LogWarning("Blacklist entry with Id {EntryId} not found", id);
                return NotFound(new { message = $"Blacklist entry with Id '{id}' not found." });
            }

            // If reporting agency changed, verify existence
            if (existing.ReportedByAgencyId != dto.ReportedByAgencyId)
            {
                var agencyExists = await _context.Set<Agency>()
                    .AnyAsync(a => a.Id == dto.ReportedByAgencyId);

                if (!agencyExists)
                {
                    _logger.LogWarning("Agency with Id {AgencyId} does not exist", dto.ReportedByAgencyId);
                    return BadRequest(new { message = $"Agency with Id '{dto.ReportedByAgencyId}' does not exist." });
                }
            }

            // Update scalar properties
            existing.NationalId = dto.NationalId;
            existing.PassportId = dto.PassportId;
            existing.LicenseNumber = dto.LicenseNumber;
            existing.FullName = dto.FullName;
            existing.Reason = dto.Reason;
            existing.ReportedByAgencyId = dto.ReportedByAgencyId;

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated blacklist entry {EntryId}", id);

            var updatedDto = new BlacklistEntryDto
            {
                Id = existing.Id,
                NationalId = existing.NationalId,
                PassportId = existing.PassportId,
                LicenseNumber = existing.LicenseNumber,
                FullName = existing.FullName,
                Reason = existing.Reason,
                DateAdded = existing.DateAdded,
                ReportedByAgencyId = existing.ReportedByAgencyId,
                ReportedByAgencyName = (await _context.Set<Agency>()
                    .Where(a => a.Id == existing.ReportedByAgencyId)
                    .Select(a => a.Name)
                    .FirstOrDefaultAsync())
            };

            return Ok(updatedDto);
        }

        /// <summary>
        /// DELETE: api/Blacklist/{id}
        /// Deletes a blacklist entry.
        /// </summary>
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteEntry(Guid id)
        {
            _logger.LogInformation("Deleting blacklist entry {EntryId}", id);

            var entry = await _context.Set<Blacklist_Entry>()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entry == null)
            {
                _logger.LogWarning("Blacklist entry with Id {EntryId} not found", id);
                return NotFound(new { message = $"Blacklist entry with Id '{id}' not found." });
            }

            _context.Set<Blacklist_Entry>().Remove(entry);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted blacklist entry {EntryId}", id);
            return NoContent();
        }
    }

    #region DTOs

    public class BlacklistEntryDto
    {
        public Guid Id { get; set; }
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string? LicenseNumber { get; set; }
        public string FullName { get; set; }
        public string Reason { get; set; }
        public DateTime DateAdded { get; set; }
        public Guid ReportedByAgencyId { get; set; }
        public string? ReportedByAgencyName { get; set; }
    }

    public class CreateBlacklistEntryDto
    {
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string? LicenseNumber { get; set; }
        public string FullName { get; set; }
        public string Reason { get; set; }
        public Guid ReportedByAgencyId { get; set; }
    }

    public class UpdateBlacklistEntryDto
    {
        public Guid Id { get; set; }
        public string? NationalId { get; set; }
        public string? PassportId { get; set; }
        public string? LicenseNumber { get; set; }
        public string FullName { get; set; }
        public string Reason { get; set; }
        public Guid ReportedByAgencyId { get; set; }
    }

    #endregion
}
