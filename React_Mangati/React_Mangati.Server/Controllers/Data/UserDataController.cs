using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Favorites;
using React_Mangati.Server.Models.Viewer;
using System.Security.Claims;

namespace React_Mangati.Server.Controllers.Data
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserDataController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<UserDataController> _logger;

        public UserDataController(ApplicationDbContext context, ILogger<UserDataController> logger)
        {
            _context = context;
            _logger = logger;
        }

        #region Favorites

        [HttpGet("favorites")]
        public async Task<IActionResult> GetFavorites()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var favorites = await _context.UserFavorites
                .Include(f => f.Serie)
                .Where(f => f.UserId == userId)
                .OrderByDescending(f => f.AddedAt)
                .Select(f => new
                {
                    f.Id,
                    f.SerieId,
                    f.AddedAt,
                    Serie = new
                    {
                        f.Serie.Id,
                        f.Serie.Title,
                        f.Serie.Synopsis,
                        f.Serie.CoverImageUrl,
                        Status = f.Serie.Status.ToString()
                    }
                })
                .ToListAsync();

            return Ok(favorites);
        }

        [HttpPost("favorites/{serieId}")]
        public async Task<IActionResult> AddFavorite(int serieId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Check if series exists
            var serieExists = await _context.Series.AnyAsync(s => s.Id == serieId);
            if (!serieExists) return NotFound(new { message = "Serie not found" });

            // Check if already favorited
            var existing = await _context.UserFavorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.SerieId == serieId);

            if (existing != null)
            {
                return Conflict(new { message = "Serie is already in favorites" });
            }

            var favorite = new UserFavorite
            {
                UserId = userId,
                SerieId = serieId,
                AddedAt = DateTime.UtcNow
            };

            _context.UserFavorites.Add(favorite);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFavorites), new { id = favorite.Id }, favorite);
        }

        [HttpDelete("favorites/{serieId}")]
        public async Task<IActionResult> RemoveFavorite(int serieId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var favorite = await _context.UserFavorites
                .FirstOrDefaultAsync(f => f.UserId == userId && f.SerieId == serieId);

            if (favorite == null)
            {
                return NotFound(new { message = "Serie is not in favorites" });
            }

            _context.UserFavorites.Remove(favorite);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("favorites/check/{serieId}")]
        public async Task<IActionResult> CheckFavorite(int serieId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var isFavorite = await _context.UserFavorites
                .AnyAsync(f => f.UserId == userId && f.SerieId == serieId);

            return Ok(new { isFavorite });
        }

        #endregion

        #region Reading Progress

        [HttpGet("progress/{chapterId}")]
        public async Task<IActionResult> GetReadingProgress(int chapterId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var progress = await _context.Reading_Progresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ChapterId == chapterId);

            if (progress == null)
            {
                return NotFound(new { message = "No reading progress found" });
            }

            return Ok(new
            {
                progress.Id,
                progress.ChapterId,
                progress.LastReadPage,
                progress.LastReadAt
            });
        }

        [HttpGet("progress/by-serie/{serieId}")]
        public async Task<IActionResult> GetReadingProgressBySerie(int serieId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Get all chapters for the serie
            var chapters = await _context.Chapters
                .Where(c => c.SerieId == serieId)
                .Select(c => c.Id)
                .ToListAsync();

            if (chapters.Count == 0)
            {
                return NotFound(new { message = "No chapters found for this serie" });
            }

            // Get reading progress for these chapters
            var progress = await _context.Reading_Progresses
                .Where(p => p.UserId == userId && chapters.Contains(p.ChapterId))
                .OrderByDescending(p => p.LastReadAt)
                .ToListAsync();

            return Ok(progress);
        }

        [HttpPost("progress")]
        public async Task<IActionResult> SaveReadingProgress(ReadingProgressDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Check if chapter exists
            var chapterExists = await _context.Chapters.AnyAsync(c => c.Id == model.ChapterId);
            if (!chapterExists) return NotFound(new { message = "Chapter not found" });

            // Find existing progress or create new
            var progress = await _context.Reading_Progresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.ChapterId == model.ChapterId);

            if (progress == null)
            {
                progress = new Reading_Progress
                {
                    UserId = userId,
                    ChapterId = model.ChapterId,
                    LastReadPage = model.LastReadPage,
                    LastReadAt = DateTime.UtcNow
                };
                _context.Reading_Progresses.Add(progress);
            }
            else
            {
                progress.LastReadPage = model.LastReadPage;
                progress.LastReadAt = DateTime.UtcNow;
                _context.Reading_Progresses.Update(progress);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                progress.Id,
                progress.ChapterId,
                progress.LastReadPage,
                progress.LastReadAt
            });
        }

        #endregion

        #region Reading Settings

        [HttpGet("settings/{serieId}")]
        public async Task<IActionResult> GetReadingSettings(int serieId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            var settings = await _context.Reading_Settings
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SerieId == serieId);

            if (settings == null)
            {
                // Return default settings if none exist
                return Ok(new
                {
                    SerieId = serieId,
                    Theme = Theme_Mode.Dark,
                    ReadingMode = Reading_Mode.VerticalScroll,
                    FitToWidth = true
                });
            }

            return Ok(new
            {
                settings.SerieId,
                Theme = settings.Theme,
                ReadingMode = settings.Reading_Mode,
                settings.FitToWidth
            });
        }

        [HttpPost("settings")]
        public async Task<IActionResult> SaveReadingSettings(ReadingSettingsDto model)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) return Unauthorized();

            // Check if serie exists
            var serieExists = await _context.Series.AnyAsync(s => s.Id == model.SerieId);
            if (!serieExists) return NotFound(new { message = "Serie not found" });

            // Find existing settings or create new
            var settings = await _context.Reading_Settings
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SerieId == model.SerieId);

            if (settings == null)
            {
                settings = new Reading_Settings
                {
                    UserId = userId,
                    SerieId = model.SerieId,
                    Theme = model.Theme,
                    Reading_Mode = model.ReadingMode,
                    FitToWidth = model.FitToWidth
                };
                _context.Reading_Settings.Add(settings);
            }
            else
            {
                settings.Theme = model.Theme;
                settings.Reading_Mode = model.ReadingMode;
                settings.FitToWidth = model.FitToWidth;
                _context.Reading_Settings.Update(settings);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                settings.SerieId,
                Theme = settings.Theme,
                ReadingMode = settings.Reading_Mode,
                settings.FitToWidth
            });
        }

        #endregion
    }

    #region DTOs

    public class ReadingProgressDto
    {
        public int ChapterId { get; set; }
        public int LastReadPage { get; set; }
    }

    public class ReadingSettingsDto
    {
        public int SerieId { get; set; }
        public Theme_Mode Theme { get; set; }
        public Reading_Mode ReadingMode { get; set; }
        public bool FitToWidth { get; set; }
    }

    #endregion
}