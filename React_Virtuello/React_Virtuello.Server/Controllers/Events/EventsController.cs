using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Events;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;
using React_Virtuello.Server.Services.Interfaces;

namespace React_Virtuello.Server.Controllers.Events
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<EventsController> _logger;
        private readonly IFileUploadService _fileUploadService;

        public EventsController(
            IUnitOfWork unitOfWork,
            ILogger<EventsController> logger,
            IFileUploadService fileUploadService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _fileUploadService = fileUploadService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<EventDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _unitOfWork.Events.GetPagedAsync(page, pageSize);
            var response = new PagedResponse<EventDto>
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
        public async Task<ActionResult<ApiResponse<EventDto>>> GetById(Guid id)
        {
            var entity = await _unitOfWork.Events.GetByIdAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Event {EventId} not found", id);
                return NotFound(new ApiResponse<EventDto> { Success = false, Message = "Not found" });
            }
            return Ok(new ApiResponse<EventDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<EventDto>>> Create([FromForm] CreateEventDto dto)
        {
            var entity = MapToEntity(dto);

            // Handle picture upload
            if (dto.PictureFile != null)
            {
                var pictureResult = await _fileUploadService.UploadImageAsync(dto.PictureFile, "events");
                if (pictureResult.Success)
                {
                    entity.Picture = pictureResult.FilePath;
                }
                else
                {
                    return BadRequest(new ApiResponse<EventDto>
                    {
                        Success = false,
                        Message = $"Picture upload failed: {pictureResult.Message}"
                    });
                }
            }

            await _unitOfWork.Events.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = entity.Id },
                new ApiResponse<EventDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<EventDto>>> Update(Guid id, [FromForm] UpdateEventDto dto)
        {
            var entity = await _unitOfWork.Events.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<EventDto> { Success = false, Message = "Not found" });
            }

            var oldPicturePath = entity.Picture;
            UpdateEntity(entity, dto);

            // Handle picture upload
            if (dto.PictureFile != null)
            {
                var pictureResult = await _fileUploadService.UploadImageAsync(dto.PictureFile, "events");
                if (pictureResult.Success)
                {
                    entity.Picture = pictureResult.FilePath;
                    // Delete old picture if exists
                    if (!string.IsNullOrEmpty(oldPicturePath))
                    {
                        await _fileUploadService.DeleteFileAsync(oldPicturePath);
                    }
                }
                else
                {
                    return BadRequest(new ApiResponse<EventDto>
                    {
                        Success = false,
                        Message = $"Picture upload failed: {pictureResult.Message}"
                    });
                }
            }
            else if (!dto.KeepExistingPicture)
            {
                // Remove existing picture
                if (!string.IsNullOrEmpty(entity.Picture))
                {
                    await _fileUploadService.DeleteFileAsync(entity.Picture);
                    entity.Picture = null;
                }
            }

            await _unitOfWork.Events.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<EventDto> { Success = true, Data = MapToDto(entity) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var entity = await _unitOfWork.Events.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<string> { Success = false, Message = "Not found" });
            }

            // Delete associated files
            if (!string.IsNullOrEmpty(entity.Picture))
            {
                await _fileUploadService.DeleteFileAsync(entity.Picture);
            }

            await _unitOfWork.Events.DeleteAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<string> { Success = true, Message = "Deleted" });
        }

        private static EventDto MapToDto(Event e) => new()
        {
            Id = e.Id,
            Name = e.Name,
            Description = e.Description,
            Picture = e.Picture,
            Start = e.Start,
            End = e.End,
            Status = e.Status,
            Type = e.Type,
            OrganizerId = e.OrganizerId,
            EventCategoryId = e.EventCategoryId,
            Latitude = e.Latitude,
            Longitude = e.Longitude,
            Address = e.Address
        };

        private static Event MapToEntity(CreateEventDto dto) => new()
        {
            Name = dto.Name,
            Description = dto.Description,
            Start = dto.Start,
            End = dto.End,
            Status = dto.Status,
            Type = dto.Type,
            OrganizerId = dto.OrganizerId,
            EventCategoryId = dto.EventCategoryId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Address = dto.Address
        };

        private static void UpdateEntity(Event entity, UpdateEventDto dto)
        {
            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.Start = dto.Start;
            entity.End = dto.End;
            entity.Status = dto.Status;
            entity.Type = dto.Type;
            entity.OrganizerId = dto.OrganizerId;
            entity.EventCategoryId = dto.EventCategoryId;
            entity.Latitude = dto.Latitude;
            entity.Longitude = dto.Longitude;
            entity.Address = dto.Address;
        }
    }
}