using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;

namespace React_Virtuello.Server.Controllers.Businesses
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusinessesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<BusinessesController> _logger;

        public BusinessesController(IUnitOfWork unitOfWork, ILogger<BusinessesController> logger)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<Business>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            _logger.LogInformation("Retrieving businesses page {Page}", page);
            var result = await _unitOfWork.Businesses.GetPagedAsync(page, pageSize);
            var response = new PagedResponse<Business>
            {
                Success = true,
                Data = result.Items,
                CurrentPage = result.PageNumber,
                PageSize = result.PageSize,
                TotalCount = result.TotalCount,
                TotalPages = result.TotalPages
            };
            return Ok(response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApiResponse<Business>>> GetById(Guid id)
        {
            var business = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (business == null)
            {
                _logger.LogWarning("Business {BusinessId} not found", id);
                return NotFound(new ApiResponse<Business> { Success = false, Message = "Not found" });
            }
            return Ok(new ApiResponse<Business> { Success = true, Data = business });
        }

        [HttpGet("owner/{ownerId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<Business>>>> GetByOwner(string ownerId)
        {
            var businesses = await _unitOfWork.Businesses.GetByOwnerAsync(ownerId);
            return Ok(new ApiResponse<IEnumerable<Business>> { Success = true, Data = businesses });
        }

        [HttpGet("search")]
        public async Task<ActionResult<ApiResponse<IEnumerable<Business>>>> Search([FromQuery] string q)
        {
            var businesses = await _unitOfWork.Businesses.SearchAsync(q);
            return Ok(new ApiResponse<IEnumerable<Business>> { Success = true, Data = businesses });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<Business>>> Create(Business business)
        {
            _logger.LogInformation("Creating business {Name}", business.Name);
            await _unitOfWork.Businesses.AddAsync(business);
            await _unitOfWork.SaveChangesAsync();
            return CreatedAtAction(nameof(GetById), new { id = business.Id }, new ApiResponse<Business> { Success = true, Data = business });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<Business>>> Update(Guid id, Business business)
        {
            if (id != business.Id) return BadRequest(new ApiResponse<Business> { Success = false, Message = "ID mismatch" });
            var existing = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (existing == null) return NotFound(new ApiResponse<Business> { Success = false, Message = "Not found" });
            _logger.LogInformation("Updating business {BusinessId}", id);
            await _unitOfWork.Businesses.UpdateAsync(business);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new ApiResponse<Business> { Success = true, Data = business });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var business = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (business == null) return NotFound(new ApiResponse<string> { Success = false, Message = "Not found" });
            _logger.LogInformation("Deleting business {BusinessId}", id);
            await _unitOfWork.Businesses.DeleteAsync(business);
            await _unitOfWork.SaveChangesAsync();
            return Ok(new ApiResponse<string> { Success = true, Message = "Deleted" });
        }
    }
}