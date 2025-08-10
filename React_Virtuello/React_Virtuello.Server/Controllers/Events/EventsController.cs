using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Events;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;

namespace React_Virtuello.Server.Controllers.Events
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<EventsController> _logger;

        public EventsController(IUnitOfWork unitOfWork, ILogger<EventsController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
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

        [HttpGet("upcoming")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventDto>>>> GetUpcoming([FromQuery] int take = 10)
        {
            var events = await _unitOfWork.Events.GetUpcomingEventsAsync(take);
            return Ok(new ApiResponse<IEnumerable<EventDto>> { Success = true, Data = events.Select(MapToDto) });
        }

        [HttpGet("organizer/{organizerId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventDto>>>> GetByOrganizer(string organizerId)
        {
            var events = await _unitOfWork.Events.GetEventsByOrganizerAsync(organizerId);
            return Ok(new ApiResponse<IEnumerable<EventDto>> { Success = true, Data = events.Select(MapToDto) });
        }

        [HttpGet("category/{categoryId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventDto>>>> GetByCategory(Guid categoryId)
        {
            var events = await _unitOfWork.Events.GetEventsByCategoryAsync(categoryId);
            return Ok(new ApiResponse<IEnumerable<EventDto>> { Success = true, Data = events.Select(MapToDto) });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<EventDto>>> Create(CreateEventDto dto)
        {
            var entity = MapToEntity(dto);
            await _unitOfWork.Events.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();
            var resultDto = MapToDto(entity);
            return CreatedAtAction(nameof(GetById), new { id = entity.Id }, new ApiResponse<EventDto> { Success = true, Data = resultDto });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<EventDto>>> Update(Guid id, UpdateEventDto dto)
        {
            var entity = await _unitOfWork.Events.GetByIdAsync(id);
            if (entity == null)
            {
                return NotFound(new ApiResponse<EventDto> { Success = false, Message = "Not found" });
            }

            UpdateEntity(entity, dto);
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
            Picture = dto.Picture,
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
            entity.Picture = dto.Picture;
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