using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Tags;
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
                .Include(s => s.Serie_Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Serie_Languages).ThenInclude(sl => sl.Language)
                .Select(s => new SerieDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    Synopsis = s.Synopsis,
                    CoverImageUrl = s.CoverImageUrl,
                    Status = s.Status.ToString(),
                    AuthorName = s.Author != null ? s.Author.FirstName + " " + s.Author.LastName : null,
                    AuthorId = s.AuthorId,
                    CreatedAt = s.CreatedAt,
                    Tags = s.Serie_Tags.Select(st => new TagDto { TagId = st.Tag.TagId, Name = st.Tag.Name }).ToList(),
                    Languages = s.Serie_Languages.Select(sl => new LanguageDto { Id = sl.Language.Id, Name = sl.Language.Name }).ToList()
                }).ToListAsync();

            return Ok(series);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var serie = await _context.Series
                .Include(s => s.Author)
                .Include(s => s.Serie_Tags).ThenInclude(st => st.Tag)
                .Include(s => s.Serie_Languages).ThenInclude(sl => sl.Language)
                .FirstOrDefaultAsync(s => s.Id == id);

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
                AuthorId = serie.AuthorId,
                CreatedAt = serie.CreatedAt,
                Tags = serie.Serie_Tags?.Select(st => new TagDto { TagId = st.Tag.TagId, Name = st.Tag.Name }).ToList() ?? new List<TagDto>(),
                Languages = serie.Serie_Languages?.Select(sl => new LanguageDto { Id = sl.Language.Id, Name = sl.Language.Name }).ToList() ?? new List<LanguageDto>()
            });
        }

        [HttpPost]
        [Authorize(Roles = "Writer,Admin,Manager")]
        public async Task<IActionResult> Create([FromForm] SerieCreateDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                string? imageUrl = null;

                // Handle cover image upload
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

                // Create the serie
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

                // Add languages
                if (model.LanguageIds != null && model.LanguageIds.Any())
                {
                    foreach (var languageId in model.LanguageIds)
                    {
                        _context.Serie_Languages.Add(new Serie_Language
                        {
                            SerieId = newSerie.Id,
                            LanguageId = languageId
                        });
                    }
                }

                // Add tags
                if (model.TagIds != null && model.TagIds.Any())
                {
                    foreach (var tagId in model.TagIds)
                    {
                        _context.Serie_Tags.Add(new Serie_Tag
                        {
                            SerieId = newSerie.Id,
                            TagId = tagId
                        });
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                _logger.LogInformation("Serie created successfully with ID: {SerieId}", newSerie.Id);

                return CreatedAtAction(nameof(GetById), new { id = newSerie.Id }, new { id = newSerie.Id });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error creating serie");
                return StatusCode(500, new { message = "An error occurred while creating the serie" });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Writer,Admin")]
        public async Task<IActionResult> Update(int id, [FromForm] SerieCreateDto model)
        {
            var serie = await _context.Series
                .Include(s => s.Serie_Languages)
                .Include(s => s.Serie_Tags)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (serie == null) return NotFound();

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
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

                // Update languages
                _context.Serie_Languages.RemoveRange(serie.Serie_Languages);
                if (model.LanguageIds != null && model.LanguageIds.Any())
                {
                    foreach (var languageId in model.LanguageIds)
                    {
                        _context.Serie_Languages.Add(new Serie_Language
                        {
                            SerieId = serie.Id,
                            LanguageId = languageId
                        });
                    }
                }

                // Update tags
                _context.Serie_Tags.RemoveRange(serie.Serie_Tags);
                if (model.TagIds != null && model.TagIds.Any())
                {
                    foreach (var tagId in model.TagIds)
                    {
                        _context.Serie_Tags.Add(new Serie_Tag
                        {
                            SerieId = serie.Id,
                            TagId = tagId
                        });
                    }
                }

                _context.Series.Update(serie);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error updating serie");
                return StatusCode(500, new { message = "An error occurred while updating the serie" });
            }
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
        public string? AuthorId { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<TagDto> Tags { get; set; } = new List<TagDto>();
        public List<LanguageDto> Languages { get; set; } = new List<LanguageDto>();
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

        public List<int>? LanguageIds { get; set; }
        public List<int>? TagIds { get; set; }
    }

    public class TagDto
    {
        public int TagId { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class LanguageDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
}