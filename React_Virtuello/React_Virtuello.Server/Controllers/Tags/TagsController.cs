using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Tags;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;
using React_Virtuello.Server.Services.Interfaces;

namespace React_Virtuello.Server.Controllers.Tags
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<TagsController> _logger;
        private readonly IFileUploadService _fileUploadService;

        public TagsController(
            IUnitOfWork unitOfWork,
            ILogger<TagsController> logger,
            IFileUploadService fileUploadService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _fileUploadService = fileUploadService;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<TagDto>>>> GetAll()
        {
            var tags = await _unitOfWork.Tags.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<TagDto>> { Success = true, Data = tags.Select(MapToDto) });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<TagDto>>> GetById(Guid id)
        {
            var tag = await _unitOfWork.Tags.GetByIdAsync(id);
            if (tag == null)
            {
                _logger.LogWarning("Tag {TagId} not found", id);
                return NotFound(new ApiResponse<TagDto> { Success = false, Message = "Not found" });
            }
            return Ok(new ApiResponse<TagDto> { Success = true, Data = MapToDto(tag) });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TagDto>>> Create([FromForm] CreateTagDto dto)
        {
            var entity = new Tag { Name = dto.Name };

            // Handle icon upload
            if (dto.IconFile != null)
            {
                var iconResult = await _fileUploadService.UploadImageAsync(dto.IconFile, "tags/icons");
                if (iconResult.Success)
                {
                    entity.IconPath = iconResult.FilePath;
                }
                else
                {
                    return BadRequest(new ApiResponse<TagDto>
                    {
                        Success = false,
                        Message = $"Icon upload failed: {iconResult.Message}"
                    });
                }
            }

            await _unitOfWork.Tags.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.Id },
                new ApiResponse<TagDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<TagDto>>> Update(Guid id, [FromForm] UpdateTagDto dto)
        {
            var entity = await _unitOfWork.Tags.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<TagDto> { Success = false, Message = "Not found" });
            }

            var oldIconPath = entity.IconPath;
            entity.Name = dto.Name;

            // Handle icon upload
            if (dto.IconFile != null)
            {
                var iconResult = await _fileUploadService.UploadImageAsync(dto.IconFile, "tags/icons");
                if (iconResult.Success)
                {
                    entity.IconPath = iconResult.FilePath;
                    // Delete old icon if exists
                    if (!string.IsNullOrEmpty(oldIconPath))
                    {
                        await _fileUploadService.DeleteFileAsync(oldIconPath);
                    }
                }
                else
                {
                    return BadRequest(new ApiResponse<TagDto>
                    {
                        Success = false,
                        Message = $"Icon upload failed: {iconResult.Message}"
                    });
                }
            }
            else if (!dto.KeepExistingIcon)
            {
                // Remove existing icon
                if (!string.IsNullOrEmpty(entity.IconPath))
                {
                    await _fileUploadService.DeleteFileAsync(entity.IconPath);
                    entity.IconPath = null;
                }
            }

            await _unitOfWork.Tags.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<TagDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var entity = await _unitOfWork.Tags.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<string> { Success = false, Message = "Not found" });
            }

            // Delete associated files
            if (!string.IsNullOrEmpty(entity.IconPath))
            {
                await _fileUploadService.DeleteFileAsync(entity.IconPath);
            }

            await _unitOfWork.Tags.DeleteAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<string> { Success = true, Message = "Deleted" });
        }

        private static TagDto MapToDto(Tag tag) => new()
        {
            Id = tag.Id,
            Name = tag.Name,
            IconPath = tag.IconPath
        };
    }
}