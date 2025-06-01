using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Tags;

namespace React_Mangati.Server.Controllers.Series
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FiltersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FiltersController(ApplicationDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// GET: api/filters/languages
        /// Returns the list of all supported languages.
        /// </summary>
        [HttpGet("languages")]
        public async Task<IActionResult> GetLanguages()
        {
            var languages = await _context.Set<Language>()
                                          .OrderBy(l => l.Name)
                                          .ToListAsync();

            return Ok(languages);
        }

        /// <summary>
        /// GET: api/filters/tags
        /// Returns the list of all tags.
        /// </summary>
        [HttpGet("tags")]
        public async Task<IActionResult> GetTags()
        {
            var tags = await _context.Set<Tag>()
                                     .OrderBy(t => t.Name)
                                     .ToListAsync();

            return Ok(tags);
        }
    }
}
