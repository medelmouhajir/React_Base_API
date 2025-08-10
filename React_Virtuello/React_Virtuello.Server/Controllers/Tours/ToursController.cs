using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Tours;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;
using React_Virtuello.Server.Services.Interfaces;

namespace React_Virtuello.Server.Controllers.Tours
{
    [ApiController]
    [Route("api/[controller]")]
    public class ToursController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<ToursController> _logger;
        private readonly IFileUploadService _fileUploadService;

        public ToursController(
            IUnitOfWork unitOfWork,
            ILogger<ToursController> logger,
            IFileUploadService fileUploadService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _fileUploadService = fileUploadService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<TourDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _unitOfWork.Tours.GetPagedAsync(page, pageSize);
            var response = new PagedResponse<TourDto>
            {
                Success = true,
                Data = result.Items.Select(MapToDto),
                CurrentPage = result.PageNumber,
                PageSize = result.PageSize,
                TotalCount = result.TotalCount,
                TotalPages = result.TotalPages
            };
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<TourDto>>> GetById(Guid id)
        {
            var tour = await _unitOfWork.Tours.GetWithScenesAsync(id);
            if (tour == null)
            {
                _logger.LogWarning("Tour {TourId} not found", id);
                return NotFound(new ApiResponse<TourDto> { Success = false, Message = "Not found" });
            }
            return Ok(new ApiResponse<TourDto> { Success = true, Data = MapToDto(tour) });
        }

        [HttpGet("owner/{ownerId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<TourDto>>>> GetByOwner(string ownerId)
        {
            var tours = await _unitOfWork.Tours.GetByOwnerAsync(ownerId);
            return Ok(new ApiResponse<IEnumerable<TourDto>> { Success = true, Data = tours.Select(MapToDto) });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<TourDto>>> Create([FromForm] CreateTourDto dto)
        {
            var entity = MapToEntity(dto);

            // Handle image upload
            if (dto.ImageFile != null)
            {
                var imageResult = await _fileUploadService.UploadImageAsync(dto.ImageFile, "tours");
                if (imageResult.Success)
                {
                    entity.ImagePath = imageResult.FilePath;
                }
                else
                {
                    return BadRequest(new ApiResponse<TourDto>
                    {
                        Success = false,
                        Message = $"Image upload failed: {imageResult.Message}"
                    });
                }
            }

            await _unitOfWork.Tours.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            var resultDto = MapToDto(entity);
            return CreatedAtAction(nameof(GetById), new { id = entity.Id },
                new ApiResponse<TourDto> { Success = true, Data = resultDto });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<TourDto>>> Update(Guid id, [FromForm] UpdateTourDto dto)
        {
            var entity = await _unitOfWork.Tours.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<TourDto> { Success = false, Message = "Not found" });
            }

            var oldImagePath = entity.ImagePath;
            UpdateEntity(entity, dto);

            // Handle image upload
            if (dto.ImageFile != null)
            {
                var imageResult = await _fileUploadService.UploadImageAsync(dto.ImageFile, "tours");
                if (imageResult.Success)
                {
                    entity.ImagePath = imageResult.FilePath;
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(oldImagePath))
                    {
                        await _fileUploadService.DeleteFileAsync(oldImagePath);
                    }
                }
                else
                {
                    return BadRequest(new ApiResponse<TourDto>
                    {
                        Success = false,
                        Message = $"Image upload failed: {imageResult.Message}"
                    });
                }
            }
            else if (!dto.KeepExistingImage)
            {
                // Remove existing image
                if (!string.IsNullOrEmpty(entity.ImagePath))
                {
                    await _fileUploadService.DeleteFileAsync(entity.ImagePath);
                    entity.ImagePath = null;
                }
            }

            await _unitOfWork.Tours.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<TourDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var entity = await _unitOfWork.Tours.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<string> { Success = false, Message = "Not found" });
            }

            // Delete associated files
            if (!string.IsNullOrEmpty(entity.ImagePath))
            {
                await _fileUploadService.DeleteFileAsync(entity.ImagePath);
            }

            await _unitOfWork.Tours.DeleteAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<string> { Success = true, Message = "Deleted" });
        }

        private static TourDto MapToDto(Tour t) => new()
        {
            Id = t.Id,
            Name = t.Name,
            Description = t.Description,
            ImagePath = t.ImagePath,
            OwnerId = t.OwnerId,
            SceneCount = t.Scenes?.Count ?? 0
        };

        private static Tour MapToEntity(CreateTourDto dto) => new()
        {
            Name = dto.Name,
            Description = dto.Description,
            OwnerId = dto.OwnerId
        };

        private static void UpdateEntity(Tour entity, UpdateTourDto dto)
        {
            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.OwnerId = dto.OwnerId;
        }
    }
}