﻿using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AgenciesController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<AgenciesController> _logger;
        private readonly IAgencyAuthorizationService _authService;

        public AgenciesController(MainDbContext context, ILogger<AgenciesController> logger , IAgencyAuthorizationService authService)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
        }

        /// <summary>
        /// GET: api/Agencies
        /// Returns the list of all agencies, including related users, cars, customers, reservations, and attachments.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAgencies()
        {
            var agencies = await _context.Set<Agency>()
                .Select(x=> new Agency
                {
                    Id = x.Id,
                    Name = x.Name,
                    Address = x.Address,
                    Email = x.Email,
                    LogoUrl = x.LogoUrl,
                    LogoUrlAssociation = x.LogoUrlAssociation,
                    PhoneOne = x.PhoneOne,
                    PhoneTwo = x.PhoneTwo,
                    Conditions = x.Conditions
                })
                .ToListAsync();

            return Ok(agencies);
        }

        /// <summary>
        /// GET: api/Agencies/{id}
        /// Returns a single agency by its Id (including related collections).
        /// </summary>
        [Authorize(Roles = "Admin,Manager,Owner")]
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAgency(Guid id)
        {
            if(! await _authService.HasAccessToAgencyAsync(id))
                return Unauthorized();
            
            var agency = await _context.Set<Agency>()
                .Include(a => a.Users)
                .Include(a => a.Cars)
                .Include(a => a.Customers)
                .Include(a => a.Reservations)
                .Include(a => a.Agency_Attachments)
                .Select(x=>  new Agency
                {
                    Id = x.Id,
                    Name = x.Name,
                    Address = x.Address,
                    LogoUrl = x.LogoUrl,
                    LogoUrlAssociation = x.LogoUrlAssociation,
                    Conditions = x.Conditions,
                    Email = x.Email,
                    PhoneOne = x.PhoneOne,
                    PhoneTwo = x.PhoneTwo,
                    Agency_Attachments = x.Agency_Attachments.Select( c=> new Agency_Attachment
                    {
                        Id = c.Id,
                        AgencyId = c.Id,
                        FileName = c.FileName,
                        FilePath = c.FilePath,
                        UploadedAt = c.UploadedAt,
                    }).ToList()
                })
                .FirstOrDefaultAsync(a => a.Id == id);

            if (agency == null)
            {
                return NotFound(new { message = $"Agency with Id '{id}' not found." });
            }

            return Ok(agency);
        }

        /// <summary>
        /// POST: api/Agencies
        /// Creates a new agency. Expects the Agency object in the request body.
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateAgency([FromBody] AgengyDTO dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var agency = new Agency
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                Address = dto.Address,
                PhoneOne = dto.PhoneOne,
                PhoneTwo = dto.PhoneTwo,
                Email = dto.Email,
                LogoUrl = "",
                
            };

            try
            {
                _context.Set<Agency>().Add(agency);
                await _context.SaveChangesAsync();
            }
            catch (Exception e)
            {

                return BadRequest();
            }

            return CreatedAtAction(nameof(GetAgency), new { id = agency.Id }, agency);
        }

        /// <summary>
        /// PUT: api/Agencies/{id}
        /// Updates an existing agency. Expects the modified Agency object in the request body.
        /// </summary>
        [Authorize(Roles = "Admin,Manager,Owner")]
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateAgency(Guid id, [FromBody] Agency updatedAgency)
        {
            if (!await _authService.HasAccessToAgencyAsync(id))
                return Unauthorized();

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (id != updatedAgency.Id)
            {
                return BadRequest(new { message = "The Id in the URL does not match the Id in the payload." });
            }

            var existingAgency = await _context.Set<Agency>()
                .Include(a => a.Agency_Attachments)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (existingAgency == null)
            {
                return NotFound(new { message = $"Agency with Id '{id}' not found." });
            }

            // Update scalar properties
            existingAgency.Name = updatedAgency.Name;
            existingAgency.Address = updatedAgency.Address;
            existingAgency.PhoneOne = updatedAgency.PhoneOne;
            existingAgency.PhoneTwo = updatedAgency.PhoneTwo;
            existingAgency.Email = updatedAgency.Email;
            existingAgency.Conditions = updatedAgency.Conditions;

            // Note: Navigation collections (Users, Cars, Customers, Reservations) 
            // are typically managed elsewhere (e.g., separate endpoints or services).
            // Here, we only update attachments if provided.

            if (updatedAgency.Agency_Attachments != null)
            {
                // Replace attachments collection
                _context.Set<Agency_Attachment>().RemoveRange(existingAgency.Agency_Attachments);

                foreach (var attach in updatedAgency.Agency_Attachments)
                {
                    attach.Id = Guid.NewGuid();
                    attach.AgencyId = existingAgency.Id;
                    _context.Set<Agency_Attachment>().Add(attach);
                }
            }

            _context.Entry(existingAgency).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return Ok();
        }

        /// <summary>
        /// DELETE: api/Agencies/{id}
        /// Deletes an agency and all its attachments.
        /// </summary>
        [Authorize(Roles = "Admin,Manager,Owner")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteAgency(Guid id)
        {
            var agency = await _context.Set<Agency>()
                .Include(a => a.Agency_Attachments)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (agency == null)
            {
                return NotFound(new { message = $"Agency with Id '{id}' not found." });
            }

            // Remove attachments first (foreign key constraint)
            if (agency.Agency_Attachments != null && agency.Agency_Attachments.Any())
            {
                _context.Set<Agency_Attachment>().RemoveRange(agency.Agency_Attachments);
            }

            _context.Set<Agency>().Remove(agency);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    #region DTOs
    public class AgengyDTO
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public string PhoneOne { get; set; }
        public string? PhoneTwo { get; set; }
        public string? Email { get; set; }
    }
    #endregion
}
