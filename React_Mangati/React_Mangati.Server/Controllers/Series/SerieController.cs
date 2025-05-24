using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Users;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace React_Mangati.Server.Controllers.Series
{
    [Route("api/[controller]")]
    [ApiController]
    public class SerieController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<SerieController> _logger;
        private readonly IWebHostEnvironment _env;

        public SerieController(ApplicationDbContext context, ILogger<SerieController> logger, IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var series = await _context.Series
                .Include(s => s.Author)
                .Select(s => new SerieDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Synopsis = s.Synopsis,
                    CoverImageUrl = s.CoverImageUrl,
                    Status = s.Status.ToString(),
                    AuthorName = s.Author != null ? s.Author.FirstName + " " + s.Author.LastName : null,
                    CreatedAt = s.CreatedAt
                }).ToListAsync();

            return Ok(series);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var serie = await _context.Series.Include(s => s.Author).FirstOrDefaultAsync(s => s.Id == id);

            if (serie == null)
                return NotFound();

            return Ok(new SerieDto
            {
                Id = serie.Id,
                Title = serie.Title,
                Synopsis = serie.Synopsis,
                CoverImageUrl = serie.CoverImageUrl,
                Status = serie.Status.ToString(),
                AuthorName = serie.Author?.FirstName + " " + serie.Author?.LastName,
                CreatedAt = serie.CreatedAt
            });
        }

        [HttpPost]
        [Authorize(Roles = "Writer,Admin,Manager")]
        public async Task<IActionResult> Create([FromForm] SerieCreateDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            string? imageUrl = null;

            if (model.CoverImage != null && model.CoverImage.Length > 0)
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads/series");
                Directory.CreateDirectory(uploadsFolder);
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(model.CoverImage.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.CoverImage.CopyToAsync(stream);
                }

                imageUrl = $"/uploads/series/{fileName}";
            }

            var newSerie = new Serie
            {
                Title = model.Title,
                Synopsis = model.Synopsis,
                CoverImageUrl = imageUrl,
                Status = model.Status,
                AuthorId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Series.Add(newSerie);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = newSerie.Id }, new { id = newSerie.Id });
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Writer,Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] SerieCreateDto model)
        {
            var serie = await _context.Series.FindAsync(id);
            if (serie == null) return NotFound();

            string? imageUrl = serie.CoverImageUrl;
            if (model.CoverImage != null && model.CoverImage.Length > 0)
            {
                var uploadsFolder = Path.Combine(_env.WebRootPath, "uploads/series");
                Directory.CreateDirectory(uploadsFolder);
                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(model.CoverImage.FileName);
                var filePath = Path.Combine(uploadsFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await model.CoverImage.CopyToAsync(stream);
                }

                imageUrl = $"/uploads/series/{fileName}";
            }

            serie.Title = model.Title;
            serie.Synopsis = model.Synopsis;
            serie.Status = model.Status;
            serie.CoverImageUrl = imageUrl;
            serie.UpdatedAt = DateTime.UtcNow;

            _context.Series.Update(serie);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Writer,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var serie = await _context.Series.FindAsync(id);
            if (serie == null) return NotFound();

            _context.Series.Remove(serie);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class SerieDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Synopsis { get; set; }
        public string? CoverImageUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AuthorName { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class SerieCreateDto
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Synopsis { get; set; }

        public IFormFile? CoverImage { get; set; }

        [Required]
        public Serie_Status Status { get; set; }
    }
}