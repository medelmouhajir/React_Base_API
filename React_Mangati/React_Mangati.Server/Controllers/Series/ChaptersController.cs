using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Series.Chapters;

namespace React_Mangati.Server.Controllers.Series
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChaptersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChaptersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Chapter>>> GetChapters()
        {
            return await _context.Chapters
                .Include(c => c.Serie)
                .Include(c => c.Pages)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetChapter(int id)
        {
            var chapter = await _context.Chapters
                .Include(c => c.Serie)
                .Include(c => c.Pages)
                .Select(x=> new
                {
                    x.Id,
                    x.Title,
                    x.Number,
                    x.Status,
                    x.UploadedAt,
                    Serie = new
                    {
                        x.Serie.Id,
                        x.Serie.Title
                    }
                })
                .FirstOrDefaultAsync(c => c.Id == id);

            if (chapter == null)
                return NotFound();

            return chapter;
        }

        [HttpGet("BySerie/{serieId}")]
        public async Task<ActionResult<IEnumerable<Chapter>>> GetChaptersBySerie(int serieId)
        {
            var chapters = await _context.Chapters
                .Where(c => c.SerieId == serieId)
                .OrderBy(c => c.Number)
                .ToListAsync();

            return chapters;
        }

        [HttpPost]
        public async Task<ActionResult<Chapter>> CreateChapter(Chapter chapter)
        {
            _context.Chapters.Add(chapter);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetChapter), new { id = chapter.Id }, chapter);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateChapter(int id, Chapter updatedChapter)
        {
            if (id != updatedChapter.Id)
                return BadRequest();

            _context.Entry(updatedChapter).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Chapters.Any(c => c.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteChapter(int id)
        {
            var chapter = await _context.Chapters.FindAsync(id);
            if (chapter == null)
                return NotFound();

            _context.Chapters.Remove(chapter);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
