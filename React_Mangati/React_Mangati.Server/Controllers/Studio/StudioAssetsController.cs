using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Studio.Characters;
using React_Mangati.Server.Models.Studio.Places;
using Microsoft.AspNetCore.Authorization;
using React_Mangati.Server.Models.Studio.Uploads;

namespace React_Mangati.Server.Controllers.Studio
{
    [Route("api/studio/assets")]
    [ApiController]
    [Authorize]
    public class StudioAssetsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _env;

        public StudioAssetsController(ApplicationDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("characters")]
        public async Task<IActionResult> GetCharacters(int serieId)
        {
            var characters = await _context.Characters
                .Where(c => c.SerieId == serieId)
                .ToListAsync();
            return Ok(characters);
        }

        [HttpGet("uploads")]
        public async Task<IActionResult> GetUploads(int serieId)
        {
            var uploads = await _context.Serie_Uploads
                .Where(c => c.SerieId == serieId)
                .ToListAsync();
            return Ok(uploads);
        }

        [HttpGet("character")]
        public async Task<IActionResult> GetCharacter(Guid characterId)
        {
            var character = await _context.Characters
                .FirstOrDefaultAsync(c => c.Id == characterId);
            return Ok(character);
        }

        [HttpPost("characters/create/{serieId}")]
        public async Task<IActionResult> CreateCharacter(int serieId , Character_DTO _DTO )
        {
            var character = new Character
            {
                Name = _DTO.Name,
                Description = _DTO.Description,
                Characters_GroupId = null,
                Height = _DTO.Height,
                Weight = _DTO.Weight,
                SerieId = serieId
            };

            _context.Characters.Add(character);
            await _context.SaveChangesAsync();

            return Ok(character);
        }


        [HttpPost("uploads/create/{serieId}")]
        public async Task<IActionResult> CreateUpload(int serieId, IFormFile fileData)
        {
            // 1. Validate
            if (fileData == null || fileData.Length == 0)
                return BadRequest("File is required.");

            // 2. Create DB record with a new Id
            var upload = new Serie_Upload
            {
                Id = Guid.NewGuid(),
                SerieId = serieId,
                Date_Uploaded = DateTime.UtcNow,
                Path = ""  // will set below
            };
            _context.Serie_Uploads.Add(upload);
            await _context.SaveChangesAsync();

            // 3. Build disk path and ensure directory exists
            var uploadDir = Path.Combine(_env.ContentRootPath, "wwwroot", "uploads", "studio", "series", serieId.ToString(), "uploads");
            Directory.CreateDirectory(uploadDir);

            // 4. Save file named by the upload.Id
            var fileName = $"{upload.Id}{Path.GetExtension(fileData.FileName)}";
            var fullPath = Path.Combine(uploadDir, fileName);
            using (var stream = System.IO.File.Create(fullPath))
            {
                await fileData.CopyToAsync(stream);
            }

            // 5. Store the relative URL path in DB
            //    e.g. "/uploads/studio/series/123/uploads/abcde-... .png"
            upload.Path = $"/uploads/studio/series/{serieId}/uploads/{fileName}";
            _context.Serie_Uploads.Update(upload);
            await _context.SaveChangesAsync();

            // 6. Return 201 Created at your GetUploads action
            return CreatedAtAction(
                nameof(GetUploads),
                new { serieId },
                upload
            );
        }



        [HttpDelete("uploads/delete/{serieId}")]
        public async Task<IActionResult> RemoveUpload(Guid uploadId )
        {
            var upload = await _context.Serie_Uploads.FirstOrDefaultAsync(x => x.Id == uploadId);

            if (upload != null)
            {
                _context.Serie_Uploads.Remove(upload);
                await _context.SaveChangesAsync();
            }

            return Ok();
        }

        [HttpGet("scenes")]
        public async Task<IActionResult> GetScenes(int serieId)
        {
            var characters = await _context.Place_Scenes
                .Where(c => c.SerieId == serieId)
                .ToListAsync();
            return Ok(characters);
        }

        // -------------------------
        // Character Images Endpoints
        // -------------------------

        [HttpGet("characters/{characterId}")]
        public async Task<IActionResult> GetCharacterImages(Guid characterId)
        {
            var images = await _context.Character_Images
                .Where(img => img.CharacterId == characterId)
                .ToListAsync();
            return Ok(images);
        }

        [HttpPost("characters/{characterId}")]
        public async Task<IActionResult> CreateCharacterImage(
            Guid characterId,
            IFormFile file,
            [FromForm] string title,
            [FromForm] bool? isMain)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is required.");

            var character = await _context.Characters.FindAsync(characterId);
            if (character == null)
                return NotFound("Character not found.");

            string serieId = character.SerieId.ToString();
            string uploadDir = Path.Combine(_env.ContentRootPath,
                "uploads", "studio", "series", serieId, "characters", characterId.ToString());
            Directory.CreateDirectory(uploadDir);

            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string filePath = Path.Combine(uploadDir, fileName);
            using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            string relativePath = Path
                .Combine("uploads", "studio", "series", serieId, "characters", characterId.ToString(), fileName)
                .Replace("\\", "/");

            var image = new Character_Image
            {
                Id = Guid.NewGuid(),
                Title = title,
                Is_Main = isMain ?? false,
                CharacterId = characterId,
                Image_Path = relativePath
            };

            _context.Character_Images.Add(image);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCharacterImages), new { characterId }, image);
        }

        [HttpPut("characters/{imageId}")]
        public async Task<IActionResult> EditCharacterImage(
            Guid imageId,
            IFormFile file = null,
            [FromForm] string title = null,
            [FromForm] bool? isMain = null)
        {
            var image = await _context.Character_Images.FindAsync(imageId);
            if (image == null)
                return NotFound("Character image not found.");

            var character = await _context.Characters.FindAsync(image.CharacterId);
            if (character == null)
                return NotFound("Character not found.");

            string serieId = character.SerieId.ToString();
            string uploadDir = Path.Combine(_env.ContentRootPath,
                "uploads", "studio", "series", serieId, "characters", image.CharacterId.ToString());

            if (file != null && file.Length > 0)
            {
                // Delete old file
                string oldPath = Path.Combine(_env.ContentRootPath, image.Image_Path);
                if (System.IO.File.Exists(oldPath))
                    System.IO.File.Delete(oldPath);

                // Save new file
                Directory.CreateDirectory(uploadDir);
                string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                string filePath = Path.Combine(uploadDir, fileName);
                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }
                image.Image_Path = Path
                    .Combine("uploads", "studio", "series", serieId, "characters", image.CharacterId.ToString(), fileName)
                    .Replace("\\", "/");
            }

            if (title != null)
                image.Title = title;
            if (isMain.HasValue)
                image.Is_Main = isMain.Value;

            _context.Character_Images.Update(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("characters/{imageId}")]
        public async Task<IActionResult> RemoveCharacterImage(Guid imageId)
        {
            var image = await _context.Character_Images.FindAsync(imageId);
            if (image == null)
                return NotFound("Character image not found.");

            var character = await _context.Characters.FindAsync(image.CharacterId);
            if (character == null)
                return NotFound("Character not found.");

            string filePath = Path.Combine(_env.ContentRootPath, image.Image_Path);
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            _context.Character_Images.Remove(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ----------------------
        // Scene Images Endpoints
        // ----------------------

        [HttpGet("scenes/{sceneId}")]
        public async Task<IActionResult> GetSceneImages(Guid sceneId)
        {
            var images = await _context.Place_Scene_Images
                .Where(img => img.Place_SceneId == sceneId)
                .ToListAsync();
            return Ok(images);
        }

        [HttpPost("scenes/{sceneId}")]
        public async Task<IActionResult> CreateSceneImage(
            Guid sceneId,
            IFormFile file,
            [FromForm] string title,
            [FromForm] string description)
        {
            if (file == null || file.Length == 0)
                return BadRequest("File is required.");

            var scene = await _context.Place_Scenes.FindAsync(sceneId);
            if (scene == null)
                return NotFound("Scene not found.");

            string serieId = scene.SerieId.ToString();
            string uploadDir = Path.Combine(_env.ContentRootPath,
                "uploads", "studio", "series", serieId, "scenes", sceneId.ToString());
            Directory.CreateDirectory(uploadDir);

            string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string filePath = Path.Combine(uploadDir, fileName);
            using (var stream = System.IO.File.Create(filePath))
            {
                await file.CopyToAsync(stream);
            }

            var imageName = string.IsNullOrEmpty(title) ? fileName : title;
            var image = new Place_Scene_Image
            {
                Id = Guid.NewGuid(),
                Name = imageName,
                Description = description,
                Place_SceneId = sceneId
                // If you add a file path property to the model, set it here
            };

            _context.Place_Scene_Images.Add(image);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSceneImages), new { sceneId }, image);
        }

        [HttpPut("scenes/{imageId}")]
        public async Task<IActionResult> EditSceneImage(
            Guid imageId,
            IFormFile file = null,
            [FromForm] string title = null,
            [FromForm] string description = null)
        {
            var image = await _context.Place_Scene_Images.FindAsync(imageId);
            if (image == null)
                return NotFound("Scene image not found.");

            var scene = await _context.Place_Scenes.FindAsync(image.Place_SceneId);
            if (scene == null)
                return NotFound("Scene not found.");

            string serieId = scene.SerieId.ToString();
            string uploadDir = Path.Combine(_env.ContentRootPath,
                "uploads", "studio", "series", serieId, "scenes", scene.Id.ToString());

            if (file != null && file.Length > 0)
            {
                // Delete old file if you store a path
                Directory.CreateDirectory(uploadDir);
                string fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
                string filePath = Path.Combine(uploadDir, fileName);
                using (var stream = System.IO.File.Create(filePath))
                {
                    await file.CopyToAsync(stream);
                }
                // Update path on model if property exists
            }

            if (title != null)
                image.Name = title;
            if (description != null)
                image.Description = description;

            _context.Place_Scene_Images.Update(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpDelete("scenes/{imageId}")]
        public async Task<IActionResult> RemoveSceneImage(Guid imageId)
        {
            var image = await _context.Place_Scene_Images.FindAsync(imageId);
            if (image == null)
                return NotFound("Scene image not found.");

            var scene = await _context.Place_Scenes.FindAsync(image.Place_SceneId);
            if (scene == null)
                return NotFound("Scene not found.");

            // Delete file if you store a path property

            _context.Place_Scene_Images.Remove(image);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    public class Character_DTO
    {
        public string Name { get; set; }

        public string Description { get; set; }

        public int Height { get; set; }
        public int Weight { get; set; }
    }
}
