using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Events;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;

namespace React_Virtuello.Server.Controllers.Events
{
    [ApiController]
    [Route("api/[controller]")]
    public class EventCategoriesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<EventCategoriesController> _logger;

        public EventCategoriesController(
            IUnitOfWork unitOfWork,
            ILogger<EventCategoriesController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventCategoryDto>>>> GetAll()
        {
            var categories = await _unitOfWork.EventCategories.GetAllAsync();
            return Ok(new ApiResponse<IEnumerable<EventCategoryDto>>
            {
                Success = true,
                Data = categories.Select(MapToDto)
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<EventCategoryDto>>> GetById(Guid id)
        {
            var category = await _unitOfWork.EventCategories.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning("Event category {CategoryId} not found", id);
                return NotFound(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Event category not found"
                });
            }
            return Ok(new ApiResponse<EventCategoryDto>
            {
                Success = true,
                Data = MapToDto(category)
            });
        }

        [HttpGet("{id}/events")]
        public async Task<ActionResult<PagedResponse<EventDto>>> GetEventsByCategory(
            Guid id,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var category = await _unitOfWork.EventCategories.GetByIdAsync(id);
            if (category == null)
            {
                _logger.LogWarning("Event category {CategoryId} not found", id);
                return NotFound(new ApiResponse<IEnumerable<EventDto>>
                {
                    Success = false,
                    Message = "Event category not found"
                });
            }

            var events = await _unitOfWork.Events.GetEventsByCategoryAsync(id);
            var totalCount = events.Count();
            var pagedEvents = events
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            var response = new PagedResponse<EventDto>
            {
                Success = true,
                Data = pagedEvents.Select(MapEventToDto),
                CurrentPage = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            };

            return Ok(response);
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<EventCategoryDto>>> Create([FromBody] CreateEventCategoryDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Invalid model state",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            // Check if category with same name already exists
            var existingCategory = await _unitOfWork.EventCategories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Name.ToLower());

            if (existingCategory != null)
            {
                return Conflict(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Event category with this name already exists"
                });
            }

            var entity = MapToEntity(dto);
            await _unitOfWork.EventCategories.AddAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Event category {CategoryId} created successfully", entity.Id);

            return CreatedAtAction(
                nameof(GetById),
                new { id = entity.Id },
                new ApiResponse<EventCategoryDto>
                {
                    Success = true,
                    Data = MapToDto(entity)
                });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<EventCategoryDto>>> Update(Guid id, [FromBody] UpdateEventCategoryDto dto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Invalid model state",
                    Errors = ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                });
            }

            var entity = await _unitOfWork.EventCategories.GetByIdAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Event category {CategoryId} not found for update", id);
                return NotFound(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Event category not found"
                });
            }

            // Check if category with same name already exists (excluding current entity)
            var existingCategory = await _unitOfWork.EventCategories
                .FirstOrDefaultAsync(c => c.Name.ToLower() == dto.Name.ToLower() && c.Id != id);

            if (existingCategory != null)
            {
                return Conflict(new ApiResponse<EventCategoryDto>
                {
                    Success = false,
                    Message = "Event category with this name already exists"
                });
            }

            UpdateEntity(entity, dto);
            await _unitOfWork.EventCategories.UpdateAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Event category {CategoryId} updated successfully", id);

            return Ok(new ApiResponse<EventCategoryDto>
            {
                Success = true,
                Data = MapToDto(entity)
            });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<ApiResponse<string>>> Delete(Guid id)
        {
            var entity = await _unitOfWork.EventCategories.GetByIdAsync(id);
            if (entity == null)
            {
                _logger.LogWarning("Event category {CategoryId} not found for deletion", id);
                return NotFound(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Event category not found"
                });
            }

            // Check if category is being used by any events
            var eventsUsingCategory = await _unitOfWork.Events.GetEventsByCategoryAsync(id);
            if (eventsUsingCategory.Any())
            {
                return BadRequest(new ApiResponse<string>
                {
                    Success = false,
                    Message = "Cannot delete event category that is being used by events"
                });
            }

            await _unitOfWork.EventCategories.DeleteAsync(entity);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogInformation("Event category {CategoryId} deleted successfully", id);

            return Ok(new ApiResponse<string>
            {
                Success = true,
                Message = "Event category deleted successfully"
            });
        }

        [HttpGet("with-event-counts")]
        public async Task<ActionResult<ApiResponse<IEnumerable<EventCategoryWithCountDto>>>> GetAllWithEventCounts()
        {
            var categories = await _unitOfWork.EventCategories.GetAllAsync();
            var categoriesWithCounts = new List<EventCategoryWithCountDto>();

            foreach (var category in categories)
            {
                var eventCount = await _unitOfWork.Events.CountAsync(e => e.EventCategoryId == category.Id);
                categoriesWithCounts.Add(new EventCategoryWithCountDto
                {
                    Id = category.Id,
                    Name = category.Name,
                    EventCount = eventCount
                });
            }

            return Ok(new ApiResponse<IEnumerable<EventCategoryWithCountDto>>
            {
                Success = true,
                Data = categoriesWithCounts
            });
        }

        // Mapping methods
        private static EventCategoryDto MapToDto(Event_Category category) => new()
        {
            Id = category.Id,
            Name = category.Name
        };

        private static Event_Category MapToEntity(CreateEventCategoryDto dto) => new()
        {
            Name = dto.Name
        };

        private static void UpdateEntity(Event_Category entity, UpdateEventCategoryDto dto)
        {
            entity.Name = dto.Name;
        }

        private static EventDto MapEventToDto(Event e) => new()
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
    }
}