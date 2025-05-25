using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Tags;

namespace React_Mangati.Server.Controllers.Series
{
    [Route("api/[controller]")]
    [ApiController]
    public class SetFiltersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public SetFiltersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// POST: api/setfilters/languages
        /// Adds a new language filter if it does not already exist.
        /// </summary>
        [HttpPost("languages")]
        public async Task<IActionResult> AddLanguage([FromBody] Language language)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check for duplicate
            var exists = await _context.Set<Language>().AnyAsync(l => l.Name.ToLower() == language.Name.Trim().ToLower());
            if (exists)
                return Conflict(new { message = "Language already exists." });

            language.Name = language.Name.Trim();

            _context.Set<Language>().Add(language);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(AddLanguage), new { id = language.Id }, language);
        }

        /// <summary>
        /// POST: api/setfilters/tags
        /// Adds a new tag filter if it does not already exist.
        /// </summary>
        [HttpPost("tags")]
        public async Task<IActionResult> AddTag([FromBody] Tag tag)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check for duplicate
            var exists = await _context.Set<Tag>().AnyAsync(t => t.Name.ToLower() == tag.Name.Trim().ToLower());
            if (exists)
                return Conflict(new { message = "Tag already exists." });

            tag.Name = tag.Name.Trim();

            _context.Set<Tag>().Add(tag);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(AddTag), new { id = tag.TagId }, tag);
        }
    }
}
