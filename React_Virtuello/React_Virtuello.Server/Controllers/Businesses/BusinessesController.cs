using Microsoft.AspNetCore.Mvc;
using React_Virtuello.Server.DTOs.Businesses;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.ReponseDTOs;
using React_Virtuello.Server.Services.Interfaces;

namespace React_Virtuello.Server.Controllers.Businesses
{
    [ApiController]
    [Route("api/[controller]")]
    public class BusinessesController : ControllerBase
    {
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<BusinessesController> _logger;
        private readonly IFileUploadService _fileUploadService;

        public BusinessesController(
            IUnitOfWork unitOfWork,
            ILogger<BusinessesController> logger,
            IFileUploadService fileUploadService)
        {
            _unitOfWork = unitOfWork;
            _logger = logger;
            _fileUploadService = fileUploadService;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResponse<BusinessDto>>> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            _logger.LogInformation("Retrieving businesses page {Page}", page);
            var result = await _unitOfWork.Businesses.GetPagedAsync(page, pageSize);
            var response = new PagedResponse<BusinessDto>
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
        public async Task<ActionResult<ApiResponse<BusinessDto>>> GetById(Guid id)
        {
            var business = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (business == null)
            {
                _logger.LogWarning("Business {BusinessId} not found", id);
                return NotFound(new ApiResponse<BusinessDto> { Success = false, Message = "Not found" });
            }
            return Ok(new ApiResponse<BusinessDto> { Success = true, Data = MapToDto(business) });
        }

        [HttpGet("owner/{ownerId}")]
        public async Task<ActionResult<ApiResponse<IEnumerable<BusinessDto>>>> GetByOwner(string ownerId)
        {
            var businesses = await _unitOfWork.Businesses.GetByOwnerAsync(ownerId);
            return Ok(new ApiResponse<IEnumerable<BusinessDto>> { Success = true, Data = businesses.Select(MapToDto) });
        }

        [HttpGet("search")]
        public async Task<ActionResult<ApiResponse<IEnumerable<BusinessDto>>>> Search([FromQuery] string q)
        {
            var businesses = await _unitOfWork.Businesses.SearchAsync(q);
            return Ok(new ApiResponse<IEnumerable<BusinessDto>> { Success = true, Data = businesses.Select(MapToDto) });
        }

        [HttpPost]
        public async Task<ActionResult<ApiResponse<BusinessDto>>> Create([FromForm] CreateBusinessDto dto)
        {
            _logger.LogInformation("Creating business {Name}", dto.Name);

            var business = MapToEntity(dto);

            // Handle image upload
            if (dto.ImageFile != null)
            {
                var imageResult = await _fileUploadService.UploadImageAsync(dto.ImageFile, "businesses/images");
                if (imageResult.Success)
                {
                    business.ImagePath = imageResult.FilePath;
                }
                else
                {
                    return BadRequest(new ApiResponse<BusinessDto>
                    {
                        Success = false,
                        Message = $"Image upload failed: {imageResult.Message}"
                    });
                }
            }

            // Handle logo upload
            if (dto.LogoFile != null)
            {
                var logoResult = await _fileUploadService.UploadImageAsync(dto.LogoFile, "businesses/logos");
                if (logoResult.Success)
                {
                    business.LogoPath = logoResult.FilePath;
                }
                else
                {
                    return BadRequest(new ApiResponse<BusinessDto>
                    {
                        Success = false,
                        Message = $"Logo upload failed: {logoResult.Message}"
                    });
                }
            }

            await _unitOfWork.Businesses.AddAsync(business);
            await _unitOfWork.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = business.Id },
                new ApiResponse<BusinessDto> { Success = true, Data = MapToDto(business) });
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ApiResponse<BusinessDto>>> Update(Guid id, [FromForm] UpdateBusinessDto dto)
        {
            var existing = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (existing == null)
            {
                return NotFound(new ApiResponse<BusinessDto> { Success = false, Message = "Not found" });
            }

            _logger.LogInformation("Updating business {BusinessId}", id);

            // Store old file paths for cleanup
            var oldImagePath = existing.ImagePath;
            var oldLogoPath = existing.LogoPath;

            // Update business properties
            UpdateEntity(existing, dto);

            // Handle image upload
            if (dto.ImageFile != null)
            {
                var imageResult = await _fileUploadService.UploadImageAsync(dto.ImageFile, "businesses/images");
                if (imageResult.Success)
                {
                    existing.ImagePath = imageResult.FilePath;
                    // Delete old image if exists
                    if (!string.IsNullOrEmpty(oldImagePath))
                    {
                        await _fileUploadService.DeleteFileAsync(oldImagePath);
                    }
                }
                else
                {
                    return BadRequest(new ApiResponse<BusinessDto>
                    {
                        Success = false,
                        Message = $"Image upload failed: {imageResult.Message}"
                    });
                }
            }
            else if (!dto.KeepExistingImage)
            {
                // Remove existing image
                if (!string.IsNullOrEmpty(existing.ImagePath))
                {
                    await _fileUploadService.DeleteFileAsync(existing.ImagePath);
                    existing.ImagePath = null;
                }
            }

            // Handle logo upload
            if (dto.LogoFile != null)
            {
                var logoResult = await _fileUploadService.UploadImageAsync(dto.LogoFile, "businesses/logos");
                if (logoResult.Success)
                {
                    existing.LogoPath = logoResult.FilePath;
                    // Delete old logo if exists
                    if (!string.IsNullOrEmpty(oldLogoPath))
                    {
                        await _fileUploadService.DeleteFileAsync(oldLogoPath);
                    }
                }
                else
                {
                    return BadRequest(new ApiResponse<BusinessDto>
                    {
                        Success = false,
                        Message = $"Logo upload failed: {logoResult.Message}"
                    });
                }
            }
            else if (!dto.KeepExistingLogo)
            {
                // Remove existing logo
                if (!string.IsNullOrEmpty(existing.LogoPath))
                {
                    await _fileUploadService.DeleteFileAsync(existing.LogoPath);
                    existing.LogoPath = null;
                }
            }

            await _unitOfWork.Businesses.UpdateAsync(existing);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<BusinessDto> { Success = true, Data = MapToDto(existing) });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var business = await _unitOfWork.Businesses.GetByIdAsync(id);
            if (business == null)
            {
                return NotFound(new ApiResponse<string> { Success = false, Message = "Not found" });
            }

            _logger.LogInformation("Deleting business {BusinessId}", id);

            // Delete associated files
            if (!string.IsNullOrEmpty(business.ImagePath))
            {
                await _fileUploadService.DeleteFileAsync(business.ImagePath);
            }
            if (!string.IsNullOrEmpty(business.LogoPath))
            {
                await _fileUploadService.DeleteFileAsync(business.LogoPath);
            }

            await _unitOfWork.Businesses.DeleteAsync(business);
            await _unitOfWork.SaveChangesAsync();

            return Ok(new ApiResponse<string> { Success = true, Message = "Deleted" });
        }

        private static BusinessDto MapToDto(Business b) => new()
        {
            Id = b.Id,
            Name = b.Name,
            Description = b.Description,
            Status = b.Status,
            Phone = b.Phone,
            Email = b.Email,
            ImagePath = b.ImagePath,
            LogoPath = b.LogoPath,
            WhatsApp = b.WhatsApp,
            Instagram = b.Instagram,
            Facebook = b.Facebook,
            Website = b.Website,
            OwnerId = b.OwnerId,
            Latitude = b.Latitude,
            Longitude = b.Longitude,
            Address = b.Address,
            AverageRating = b.AverageRating,
            CommentCount = b.CommentCount,
            CreatedAt = b.CreatedAt,
            UpdatedAt = b.UpdatedAt
        };

        private static Business MapToEntity(CreateBusinessDto dto) => new()
        {
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            Phone = dto.Phone,
            Email = dto.Email,
            WhatsApp = dto.WhatsApp,
            Instagram = dto.Instagram,
            Facebook = dto.Facebook,
            Website = dto.Website,
            OwnerId = dto.OwnerId,
            Latitude = dto.Latitude,
            Longitude = dto.Longitude,
            Address = dto.Address
        };

        private static void UpdateEntity(Business entity, UpdateBusinessDto dto)
        {
            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.Status = dto.Status;
            entity.Phone = dto.Phone;
            entity.Email = dto.Email;
            entity.WhatsApp = dto.WhatsApp;
            entity.Instagram = dto.Instagram;
            entity.Facebook = dto.Facebook;
            entity.Website = dto.Website;
            entity.OwnerId = dto.OwnerId;
            entity.Latitude = dto.Latitude;
            entity.Longitude = dto.Longitude;
            entity.Address = dto.Address;
        }
    }
}