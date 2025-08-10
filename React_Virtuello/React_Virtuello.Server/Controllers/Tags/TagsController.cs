using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Tags;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;

namespace React_Virtuello.Server.Controllers.Tags
{
    [ApiController]
    [Route("api/[controller]")]
    public class TagsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<TagsController> _logger;

        public TagsController(IUnitOfWork unitOfWork, ILogger<TagsController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
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
        public async Task<ActionResult<ApiResponse<TagDto>>> Create(CreateTagDto dto)
        {
            var entity = new Tag { Name = dto.Name, IconPath = dto.IconPath };
            await _unitOfWork.Tags.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ApiResponse<TagDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<TagDto>>> Update(Guid id, CreateTagDto dto)
        {
            var entity = await _unitOfWork.Tags.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<TagDto> { Success = false, Message = "Not found" });
            }
            entity.Name = dto.Name;
            entity.IconPath = dto.IconPath;
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