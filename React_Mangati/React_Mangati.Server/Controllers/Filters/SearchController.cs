using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Series;
using System.Linq;
using System.Threading.Tasks;

namespace React_Mangati.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class SearchController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SearchController> _logger;

        public SearchController(ApplicationDbContext context, ILogger<SearchController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string q = "",
            [FromQuery] int? languageId = null,
            [FromQuery] string tagIds = "")
        {
            _logger.LogInformation("Search request: q={Query}, languageId={LanguageId}, tagIds={TagIds}",
                q, languageId, tagIds);

            var query = _context.Series
                .Include(s => s.Author)
                .Include(s => s.Serie_Tags)
                    .ThenInclude(st => st.Tag)
                .Include(s => s.Serie_Languages)
                    .ThenInclude(sl => sl.Language)
                .AsQueryable();

            // Search by keywords in title or synopsis
            if (!string.IsNullOrWhiteSpace(q))
            {
                string searchTerm = q.ToLower();
                query = query.Where(s =>
                    s.Title.ToLower().Contains(searchTerm) ||
                    (s.Synopsis != null && s.Synopsis.ToLower().Contains(searchTerm)));
            }

            // Filter by language
            if (languageId.HasValue)
            {
                query = query.Where(s =>
                    s.Serie_Languages.Any(sl => sl.LanguageId == languageId.Value));
            }

            // Filter by tags
            if (!string.IsNullOrWhiteSpace(tagIds))
            {
                var tagIdList = tagIds.Split(',')
                    .Where(id => !string.IsNullOrWhiteSpace(id))
                    .Select(id => int.TryParse(id, out int tagId) ? tagId : 0)
                    .Where(id => id > 0)
                    .ToList();

                if (tagIdList.Any())
                {
                    query = query.Where(s =>
                        s.Serie_Tags.Any(st => tagIdList.Contains(st.TagId)));
                }
            }

            var results = await query
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Synopsis,
                    s.CoverImageUrl,
                    Status = s.Status.ToString(),
                    AuthorName = s.Author != null ? s.Author.FirstName + " " + s.Author.LastName : null,
                    AuthorId = s.AuthorId,
                    Tags = s.Serie_Tags.Select(st => new { st.Tag.TagId, st.Tag.Name }),
                    Languages = s.Serie_Languages.Select(sl => new { sl.Language.Id, sl.Language.Name }),
                    s.CreatedAt,
                    s.UpdatedAt,
                    ChapterCount = s.Chapters.Count
                })
                .OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt)
                .ToListAsync();

            _logger.LogInformation("Search returned {Count} results", results.Count);
            return Ok(results);
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending([FromQuery] int limit = 5)
        {
            // Here we would normally use some metrics to determine trending series
            // For demo purposes, we'll just return the most popular series based on chapter count
            var trending = await _context.Series
                .Include(s => s.Author)
                .Include(s => s.Serie_Tags)
                    .ThenInclude(st => st.Tag)
                .Include(s => s.Chapters)
                .OrderByDescending(s => s.Chapters.Count)
                .Take(limit)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Synopsis,
                    s.CoverImageUrl,
                    Status = s.Status.ToString(),
                    AuthorName = s.Author != null ? s.Author.FirstName + " " + s.Author.LastName : null,
                    Tags = s.Serie_Tags.Select(st => new { st.Tag.TagId, st.Tag.Name }),
                    ChapterCount = s.Chapters.Count
                })
                .ToListAsync();

            return Ok(trending);
        }

        [HttpGet("recent")]
        public async Task<IActionResult> GetRecent([FromQuery] int limit = 5)
        {
            var recent = await _context.Series
                .Include(s => s.Author)
                .Include(s => s.Serie_Tags)
                    .ThenInclude(st => st.Tag)
                .OrderByDescending(s => s.UpdatedAt ?? s.CreatedAt)
                .Take(limit)
                .Select(s => new
                {
                    s.Id,
                    s.Title,
                    s.Synopsis,
                    s.CoverImageUrl,
                    Status = s.Status.ToString(),
                    AuthorName = s.Author != null ? s.Author.FirstName + " " + s.Author.LastName : null,
                    Tags = s.Serie_Tags.Select(st => new { st.Tag.TagId, st.Tag.Name }),
                    UpdatedAt = s.UpdatedAt ?? s.CreatedAt
                })
                .ToListAsync();

            return Ok(recent);
        }
    }
}