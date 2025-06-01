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
    public class PagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public PagesController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("ByChapter/{chapterId}")]
        public async Task<IActionResult> GetByChapterId(int chapterId)
        {
            var pages = await _context.Pages
                .Where(p => p.ChapterId == chapterId)
                .OrderBy(p => p.Order)
                .ToListAsync();
            return Ok(pages);
        }

        [HttpPost("Upload/{chapterId}")]
        public async Task<IActionResult> Upload(int chapterId, [FromForm] IFormFileCollection images)
        {
            var results = new List<Page>();
            var count = await _context.Pages.Where(p => p.ChapterId == chapterId).CountAsync();
            int order = count + 1;

            foreach (var file in images)
            {
                var fileName = Guid.NewGuid() + Path.GetExtension(file.FileName);
                var path = Path.Combine(_env.WebRootPath, "uploads", "pages");
                Directory.CreateDirectory(path);
                var fullPath = Path.Combine(path, fileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                    await file.CopyToAsync(stream);

                var page = new Page
                {
                    ImageUrl = $"/uploads/pages/{fileName}",
                    FileSizeBytes = file.Length,
                    Order = order++,
                    ChapterId = chapterId
                };

                _context.Pages.Add(page);
                results.Add(page);
            }

            await _context.SaveChangesAsync();
            return Ok(results);
        }

        [HttpPost("Reorder")]
        public async Task<IActionResult> Reorder(List<Page> reorderedPages)
        {
            foreach (var page in reorderedPages)
            {
                var existing = await _context.Pages.FindAsync(page.Id);
                if (existing != null)
                {
                    existing.Order = page.Order;
                }
            }

            await _context.SaveChangesAsync();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var page = await _context.Pages.FindAsync(id);
            if (page == null) return NotFound();

            _context.Pages.Remove(page);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
