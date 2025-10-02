using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Filters.Cars;

namespace React_Rentify.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CarFiltersController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<CarFiltersController> _logger;

        public CarFiltersController(MainDbContext context, ILogger<CarFiltersController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ===========================
        // Manufacturers Endpoints
        // ===========================

        /// <summary>
        /// GET: api/CarFilters/manufacturers
        /// Returns all manufacturers.
        /// </summary>
        [HttpGet("manufacturers")]
        public async Task<IActionResult> GetManufacturers()
        {
            _logger.LogInformation("Retrieving all manufacturers");
            var manufacturers = await _context.Set<Manufacturer>()
                                              .Include(m => m.Car_Models)
                                              .ToListAsync();

            var dtoList = manufacturers.Select(m => new ManufacturerDto
            {
                Id = m.Id,
                Name = m.Name
            }).ToList();

            _logger.LogInformation("Retrieved {Count} manufacturers", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/CarFilters/manufacturers
        /// Adds a new manufacturer.
        /// </summary>
        [HttpPost("manufacturers")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddManufacturer([FromBody] CreateManufacturerDto dto)
        {
            _logger.LogInformation("Adding new manufacturer with Id {ManufacturerId}", dto.Name);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateManufacturerDto received");
                return BadRequest(ModelState);
            }

            // Check for duplicate Id or Name
            var existsById = await _context.Set<Manufacturer>()
                                           .AnyAsync(m => m.Id == dto.Name.ToLower());
            if (existsById)
            {
                _logger.LogWarning("Manufacturer with Id {ManufacturerId} already exists", dto.Name);
                return Conflict(new { message = $"Manufacturer with Id '{dto.Name}' already exists." });
            }

            var existsByName = await _context.Set<Manufacturer>()
                                             .AnyAsync(m => m.Name == dto.Name);
            if (existsByName)
            {
                _logger.LogWarning("Manufacturer with Name {Name} already exists", dto.Name);
                return Conflict(new { message = $"Manufacturer with name '{dto.Name}' already exists." });
            }

            var manufacturer = new Manufacturer
            {
                Id = dto.Name.ToLower(),
                Name = dto.Name,
                Car_Models = new List<Car_Model>()
            };

            _context.Set<Manufacturer>().Add(manufacturer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added manufacturer {ManufacturerId}", manufacturer.Id);
            return CreatedAtAction(nameof(GetManufacturers), new { id = manufacturer.Id }, new ManufacturerDto
            {
                Id = manufacturer.Id,
                Name = manufacturer.Name
            });
        }

        /// <summary>
        /// DELETE: api/CarFilters/manufacturers/{id}
        /// Removes a manufacturer (only if no models exist under it).
        /// </summary>
        [HttpDelete("manufacturers/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveManufacturer(string id)
        {
            _logger.LogInformation("Removing manufacturer {ManufacturerId}", id);

            var manufacturer = await _context.Set<Manufacturer>()
                                             .Include(m => m.Car_Models)
                                             .FirstOrDefaultAsync(m => m.Id == id);
            if (manufacturer == null)
            {
                _logger.LogWarning("Manufacturer with Id {ManufacturerId} not found", id);
                return NotFound(new { message = $"Manufacturer with Id '{id}' not found." });
            }

            if (manufacturer.Car_Models != null && manufacturer.Car_Models.Any())
            {
                _logger.LogWarning("Cannot remove Manufacturer {ManufacturerId} because it has associated Car_Models", id);
                return BadRequest(new { message = "Cannot remove manufacturer with existing car models." });
            }

            _context.Set<Manufacturer>().Remove(manufacturer);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed manufacturer {ManufacturerId}", id);
            return NoContent();
        }

        // ===========================
        // Car Models Endpoints
        // ===========================

        /// <summary>
        /// GET: api/CarFilters/models
        /// Returns all car models (including manufacturer name).
        /// </summary>
        [HttpGet("models")]
        public async Task<IActionResult> GetCarModels()
        {
            _logger.LogInformation("Retrieving all car models");
            var models = await _context.Set<Car_Model>()
                                       .Include(m => m.Manufacturer)
                                       .ToListAsync();

            var dtoList = models.Select(m => new CarModelDto
            {
                Id = m.Id,
                Name = m.Name,
                ManufacturerId = m.ManufacturerId,
                ManufacturerName = m.Manufacturer != null ? m.Manufacturer.Name : null
            }).ToList();

            _logger.LogInformation("Retrieved {Count} car models", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/CarFilters/models
        /// Adds a new car model under a manufacturer.
        /// </summary>
        [HttpPost("models")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddCarModel([FromBody] CreateCarModelDto dto)
        {
            _logger.LogInformation("Adding new car model with Id {ModelId}", dto.Name);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarModelDto received");
                return BadRequest(ModelState);
            }

            // Check for duplicate Id or Name under same manufacturer
            var existsById = await _context.Set<Car_Model>()
                                           .AnyAsync(m => m.Id == dto.Name.ToLower());
            if (existsById)
            {
                _logger.LogWarning("Car_MODEL with Id {ModelId} already exists", dto.Name);
                return Conflict(new { message = $"Car model with Id '{dto.Name}' already exists." });
            }

            var existsByName = await _context.Set<Car_Model>()
                                             .AnyAsync(m => m.Name == dto.Name && m.ManufacturerId == dto.ManufacturerId);
            if (existsByName)
            {
                _logger.LogWarning("Car_MODEL with Name {Name} under Manufacturer {ManufacturerId} already exists", dto.Name, dto.ManufacturerId);
                return Conflict(new { message = $"Car model with name '{dto.Name}' already exists under this manufacturer." });
            }

            // Verify manufacturer exists
            var manufacturerExists = await _context.Set<Manufacturer>()
                                                   .AnyAsync(m => m.Id == dto.ManufacturerId);
            if (!manufacturerExists)
            {
                _logger.LogWarning("Manufacturer with Id {ManufacturerId} not found", dto.ManufacturerId);
                return BadRequest(new { message = $"Manufacturer with Id '{dto.ManufacturerId}' does not exist." });
            }

            var carModel = new Car_Model
            {
                Id = dto.Name.ToLower(),
                Name = dto.Name,
                ManufacturerId = dto.ManufacturerId
            };

            _context.Set<Car_Model>().Add(carModel);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added car model {ModelId}", carModel.Id);
            return CreatedAtAction(nameof(GetCarModels), new { id = carModel.Id }, new CarModelDto
            {
                Id = carModel.Id,
                Name = carModel.Name,
                ManufacturerId = carModel.ManufacturerId,
                ManufacturerName = null // client can look up later
            });
        }

        /// <summary>
        /// DELETE: api/CarFilters/models/{id}
        /// Removes a car model (only if no cars reference it).
        /// </summary>
        [HttpDelete("models/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveCarModel(string id)
        {
            _logger.LogInformation("Removing car model {ModelId}", id);

            var model = await _context.Set<Car_Model>()
                                      .Include(m => m.Cars)
                                      .FirstOrDefaultAsync(m => m.Id == id);
            if (model == null)
            {
                _logger.LogWarning("Car_MODEL with Id {ModelId} not found", id);
                return NotFound(new { message = $"Car model with Id '{id}' not found." });
            }

            if (model.Cars != null && model.Cars.Any())
            {
                _logger.LogWarning("Cannot remove Car_MODEL {ModelId} because it has associated Cars", id);
                return BadRequest(new { message = "Cannot remove car model with existing cars." });
            }

            _context.Set<Car_Model>().Remove(model);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed car model {ModelId}", id);
            return NoContent();
        }

        // ===========================
        // Car Years Endpoints
        // ===========================

        /// <summary>
        /// GET: api/CarFilters/years
        /// Returns all car years (sorted descending by YearValue).
        /// </summary>
        [HttpGet("years")]
        public async Task<IActionResult> GetCarYears()
        {
            _logger.LogInformation("Retrieving all car years");
            var years = await _context.Set<Car_Year>()
                                      .OrderByDescending(y => y.YearValue)
                                      .ToListAsync();

            var dtoList = years.Select(y => new CarYearDto
            {
                Id = y.Id,
                YearValue = y.YearValue
            }).ToList();

            _logger.LogInformation("Retrieved {Count} car years", dtoList.Count);
            return Ok(dtoList);
        }

        /// <summary>
        /// POST: api/CarFilters/years
        /// Adds a new car year.
        /// </summary>
        [HttpPost("years")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddCarYear([FromBody] CreateCarYearDto dto)
        {
            _logger.LogInformation("Adding new car year {YearValue}", dto.YearValue);

            if (!ModelState.IsValid)
            {
                _logger.LogWarning("Invalid CreateCarYearDto received");
                return BadRequest(ModelState);
            }

            // Check for duplicate YearValue
            var exists = await _context.Set<Car_Year>()
                                       .AnyAsync(y => y.YearValue == dto.YearValue);
            if (exists)
            {
                _logger.LogWarning("Car_Year with YearValue {YearValue} already exists", dto.YearValue);
                return Conflict(new { message = $"Car year '{dto.YearValue}' already exists." });
            }

            var carYear = new Car_Year
            {
                YearValue = dto.YearValue
            };

            _context.Set<Car_Year>().Add(carYear);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added car year {YearValue}", dto.YearValue);
            return CreatedAtAction(nameof(GetCarYears), new { id = carYear.Id }, new CarYearDto
            {
                Id = carYear.Id,
                YearValue = carYear.YearValue
            });
        }

        /// <summary>
        /// DELETE: api/CarFilters/years/{id}
        /// Removes a car year (only if no cars reference it).
        /// </summary>
        [HttpDelete("years/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RemoveCarYear(int id)
        {
            _logger.LogInformation("Removing car year {YearId}", id);

            var year = await _context.Set<Car_Year>()
                                     .Include(y => y.Cars)
                                     .FirstOrDefaultAsync(y => y.Id == id);
            if (year == null)
            {
                _logger.LogWarning("Car_Year with Id {YearId} not found", id);
                return NotFound(new { message = $"Car year with Id '{id}' not found." });
            }

            if (year.Cars != null && year.Cars.Any())
            {
                _logger.LogWarning("Cannot remove Car_Year {YearId} because it has associated Cars", id);
                return BadRequest(new { message = "Cannot remove car year with existing cars." });
            }

            _context.Set<Car_Year>().Remove(year);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Removed car year {YearId}", id);
            return NoContent();
        }


        [HttpPost("upload")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadFiltersJson([FromBody] List<UploadManufacturerDto> uploadData)
        {
            _logger.LogInformation("Uploading filters from JSON");

            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (uploadData == null || !uploadData.Any())
                return BadRequest(new { message = "No data provided for upload." });

            var result = new UploadResultDto
            {
                ManufacturersAdded = 0,
                ModelsAdded = 0,
                Skipped = 0,
                Errors = new List<string>()
            };

            // Deduplicate within this request (avoid re-adding the same key twice)
            var seenManufacturerIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var seenModelIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            foreach (var manufacturerDto in uploadData)
            {
                try
                {
                    if (string.IsNullOrWhiteSpace(manufacturerDto.Id) || string.IsNullOrWhiteSpace(manufacturerDto.Name))
                    {
                        result.Errors.Add("Invalid manufacturer data: missing id or name");
                        result.Skipped++;
                        continue;
                    }

                    var manufacturerId = manufacturerDto.Id.Trim().ToLowerInvariant();

                    // Skip if this request already handled the same manufacturer id
                    if (!seenManufacturerIds.Add(manufacturerId))
                    {
                        _logger.LogDebug("Duplicate manufacturer id {ManufacturerId} in payload, skipping.", manufacturerId);
                        result.Skipped++;
                        continue;
                    }

                    // Load manufacturer WITHOUT tracking
                    var existingManufacturer = await _context.Set<Manufacturer>()
                        .AsNoTracking()
                        .FirstOrDefaultAsync(m => m.Id == manufacturerId);

                    bool manufacturerAdded = false;

                    if (existingManufacturer == null)
                    {
                        // Create new manufacturer (tracked)
                        var manufacturer = new Manufacturer
                        {
                            Id = manufacturerId,
                            Name = manufacturerDto.Name.Trim()
                        };

                        _context.Set<Manufacturer>().Add(manufacturer);
                        manufacturerAdded = true;

                        _logger.LogInformation("Adding new manufacturer: {ManufacturerName}", manufacturer.Name);
                    }
                    else
                    {
                        _logger.LogInformation("Manufacturer {ManufacturerName} exists; will only add missing models.", existingManufacturer.Name);
                    }

                    int modelsAddedForThisManufacturer = 0;

                    if (manufacturerDto.Models != null && manufacturerDto.Models.Any())
                    {
                        foreach (var modelDto in manufacturerDto.Models)
                        {
                            try
                            {
                                if (string.IsNullOrWhiteSpace(modelDto.Id) || string.IsNullOrWhiteSpace(modelDto.Name))
                                {
                                    result.Errors.Add($"Invalid model data for manufacturer {manufacturerDto.Name}: missing id or name");
                                    result.Skipped++;
                                    continue;
                                }

                                var modelId = modelDto.Id.Trim().ToLowerInvariant();
                                var modelName = modelDto.Name.Trim();

                                // First: prevent duplicates in THIS request
                                if (!seenModelIds.Add(modelId))
                                {
                                    _logger.LogDebug("Model id {ModelId} already processed in this request, skipping.", modelId);
                                    result.Skipped++;
                                    continue;
                                }

                                // Second: if the model is already tracked locally, skip
                                var localTracked = _context.Set<Car_Model>().Local.FirstOrDefault(x => x.Id == modelId);
                                if (localTracked != null)
                                {
                                    _logger.LogDebug("Model {ModelId} already tracked locally, skipping.", modelId);
                                    result.Skipped++;
                                    continue;
                                }

                                // Third: check database WITHOUT tracking
                                var existsInDb = await _context.Set<Car_Model>()
                                    .AsNoTracking()
                                    .AnyAsync(m => m.Id == modelId
                                                || (m.Name == modelName && m.ManufacturerId == manufacturerId));

                                if (existsInDb)
                                {
                                    _logger.LogDebug("Model {ModelName} already exists in DB for manufacturer {ManufacturerId}, skipping.", modelName, manufacturerId);
                                    result.Skipped++;
                                    continue;
                                }

                                // Safe to add (tracked)
                                _context.Set<Car_Model>().Add(new Car_Model
                                {
                                    Id = modelId,
                                    Name = modelName,
                                    ManufacturerId = manufacturerId
                                });

                                modelsAddedForThisManufacturer++;
                                _logger.LogInformation("Adding new model: {ModelName} for manufacturer {ManufacturerId}", modelName, manufacturerId);
                            }
                            catch (Exception modelEx)
                            {
                                _logger.LogError(modelEx, "Error processing model {ModelName}", modelDto.Name);
                                result.Errors.Add($"Error adding model {modelDto.Name}: {modelEx.Message}");
                                result.Skipped++;
                            }
                        }
                    }

                    await _context.SaveChangesAsync();

                    if (manufacturerAdded) result.ManufacturersAdded++;
                    result.ModelsAdded += modelsAddedForThisManufacturer;

                    _logger.LogInformation("Saved manufacturer {ManufacturerId} with {ModelCount} new models",
                        manufacturerId, modelsAddedForThisManufacturer);

                    // Optional: clear tracker to avoid collisions in next loop iteration
                    _context.ChangeTracker.Clear();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing manufacturer {ManufacturerName}", manufacturerDto.Name);
                    result.Errors.Add($"Error adding manufacturer {manufacturerDto.Name}: {ex.Message}");
                    result.Skipped++;
                    _context.ChangeTracker.Clear(); // recover if the tracker is in a bad state
                }
            }

            _logger.LogInformation(
                "Upload completed: {ManufacturersAdded} manufacturers, {ModelsAdded} models added, {Skipped} skipped",
                result.ManufacturersAdded, result.ModelsAdded, result.Skipped);

            return Ok(result);
        }

    }

    #region DTOs

    public class ManufacturerDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    public class CreateManufacturerDto
    {
        public string Name { get; set; }
    }

    public class CarModelDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string ManufacturerId { get; set; }
        public string? ManufacturerName { get; set; }
    }

    public class CreateCarModelDto
    {
        public string Name { get; set; }
        public string ManufacturerId { get; set; }
    }

    public class CarYearDto
    {
        public int Id { get; set; }
        public int YearValue { get; set; }
    }

    public class CreateCarYearDto
    {
        public int YearValue { get; set; }
    }

    public class UploadManufacturerDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<UploadModelDto> Models { get; set; }
    }

    public class UploadModelDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    public class UploadResultDto
    {
        public int ManufacturersAdded { get; set; }
        public int ModelsAdded { get; set; }
        public int Skipped { get; set; }
        public List<string> Errors { get; set; }
    }
    #endregion
}
