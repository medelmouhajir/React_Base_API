using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Accidents;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Services;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AccidentsController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<AccidentsController> _logger;
        private readonly IAgencyAuthorizationService _authService;
        private readonly IWebHostEnvironment _env;

        public AccidentsController(
            MainDbContext context,
            ILogger<AccidentsController> logger,
            IAgencyAuthorizationService authService,
            IWebHostEnvironment env)
        {
            _context = context;
            _logger = logger;
            _authService = authService;
            _env = env;
        }

        // ========================
        // === Accident Endpoints
        // ========================

        /// <summary>
        /// GET: api/Accidents
        /// Returns all accidents (Admin only)
        /// </summary>
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult> GetAllAccidents()
        {
            _logger.LogInformation("Retrieving all accidents");

            var accidents = await _context.Set<Accident>()
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .OrderByDescending(a => a.AccidentDate)
                .ToListAsync();

            return Ok(accidents.Select(MapToDto));
        }

        /// <summary>
        /// GET: api/Accidents/{id}
        /// Returns a single accident by Id
        /// </summary>
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetAccidentById(Guid id)
        {
            _logger.LogInformation("Retrieving accident {AccidentId}", id);

            var accident = await _context.Set<Accident>()
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (accident == null)
            {
                _logger.LogWarning("Accident {AccidentId} not found", id);
                return NotFound(new { message = $"Accident '{id}' not found." });
            }

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            return Ok(MapToDto(accident));
        }

        /// <summary>
        /// GET: api/Accidents/agency/{agencyId}
        /// Returns all accidents for a specific agency
        /// </summary>
        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetAccidentsByAgencyId(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            _logger.LogInformation("Retrieving accidents for agency {AgencyId}", agencyId);

            var accidents = await _context.Set<Accident>()
                .Where(a => a.AgencyId == agencyId)
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .OrderByDescending(a => a.AccidentDate)
                .ToListAsync();

            return Ok(accidents.Select(MapToDto));
        }

        /// <summary>
        /// GET: api/Accidents/car/{carId}
        /// Returns all accidents for a specific car
        /// </summary>
        [HttpGet("car/{carId:guid}")]
        public async Task<IActionResult> GetAccidentsByCarId(Guid carId)
        {
            _logger.LogInformation("Retrieving accidents for car {CarId}", carId);

            var car = await _context.Set<Car>().FindAsync(carId);
            if (car == null)
                return NotFound(new { message = $"Car '{carId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(car.AgencyId))
                return Unauthorized();

            var accidents = await _context.Set<Accident>()
                .Where(a => a.CarId == carId)
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .OrderByDescending(a => a.AccidentDate)
                .ToListAsync();

            return Ok(accidents.Select(MapToDto));
        }

        /// <summary>
        /// POST: api/Accidents
        /// Creates a new accident
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateAccident([FromBody] CreateAccidentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _authService.HasAccessToAgencyAsync(dto.AgencyId))
                return Unauthorized();

            _logger.LogInformation("Creating accident for agency {AgencyId}", dto.AgencyId);

            // Validate car exists and belongs to agency
            var car = await _context.Set<Car>().FindAsync(dto.CarId);
            if (car == null || car.AgencyId != dto.AgencyId)
                return BadRequest(new { message = "Invalid car for this agency." });

            // Validate reservation if provided
            if (dto.ReservationId.HasValue)
            {
                var reservation = await _context.Set<Reservation>().FindAsync(dto.ReservationId.Value);
                if (reservation == null || reservation.AgencyId != dto.AgencyId)
                    return BadRequest(new { message = "Invalid reservation for this agency." });
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var accident = new Accident
            {
                Id = Guid.NewGuid(),
                AgencyId = dto.AgencyId,
                CarId = dto.CarId,
                ReservationId = dto.ReservationId,
                AccidentDate = dto.AccidentDate,
                Notes = dto.Notes,
                Status = Accident_Status.Created,
                ExpertFullname = dto.ExpertFullname,
                ExpertPhone = dto.ExpertPhone,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<Accident>().Add(accident);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created accident {AccidentId}", accident.Id);

            var created = await _context.Set<Accident>()
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .FirstOrDefaultAsync(a => a.Id == accident.Id);

            return CreatedAtAction(nameof(GetAccidentById), new { id = accident.Id }, MapToDto(created!));
        }

        /// <summary>
        /// PUT: api/Accidents/{id}
        /// Updates an existing accident
        /// </summary>
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateAccident(Guid id, [FromBody] UpdateAccidentDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != dto.Id)
                return BadRequest(new { message = "URL id does not match payload id." });

            _logger.LogInformation("Updating accident {AccidentId}", id);

            var accident = await _context.Set<Accident>().FindAsync(id);
            if (accident == null)
                return NotFound(new { message = $"Accident '{id}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            // Update fields
            accident.AccidentDate = dto.AccidentDate;
            accident.Notes = dto.Notes;
            accident.Status = dto.Status;
            accident.ExpertFullname = dto.ExpertFullname;
            accident.ExpertPhone = dto.ExpertPhone;

            _context.Entry(accident).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated accident {AccidentId}", id);

            var updated = await _context.Set<Accident>()
                .Include(a => a.Agency)
                .Include(a => a.Car)
                    .ThenInclude(c => c.Car_Model)
                    .ThenInclude(m => m.Manufacturer)
                .Include(a => a.Reservation)
                .Include(a => a.CreatedByUser)
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .FirstOrDefaultAsync(a => a.Id == id);

            return Ok(MapToDto(updated!));
        }

        /// <summary>
        /// DELETE: api/Accidents/{id}
        /// Deletes an accident (Owner only)
        /// </summary>
        [Authorize(Roles = "Owner")]
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteAccident(Guid id)
        {
            _logger.LogInformation("Deleting accident {AccidentId}", id);

            var accident = await _context.Set<Accident>()
                .Include(a => a.Accident_Expenses)
                .Include(a => a.Accident_Refunds)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (accident == null)
                return NotFound(new { message = $"Accident '{id}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            // Delete associated files
            var uploadsFolder = Path.Combine(
                _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                "uploads", "Agencies", accident.AgencyId.ToString(), "Accident", id.ToString());

            if (Directory.Exists(uploadsFolder))
            {
                Directory.Delete(uploadsFolder, true);
            }

            // Remove expenses and refunds (cascade will handle this if configured in EF)
            if (accident.Accident_Expenses != null)
                _context.Set<Accident_Expense>().RemoveRange(accident.Accident_Expenses);

            if (accident.Accident_Refunds != null)
                _context.Set<Accident_Refund>().RemoveRange(accident.Accident_Refunds);

            _context.Set<Accident>().Remove(accident);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted accident {AccidentId}", id);
            return NoContent();
        }

        // ========================
        // === Expense Endpoints
        // ========================

        /// <summary>
        /// GET: api/Accidents/{accidentId}/expenses
        /// Gets all expenses for an accident
        /// </summary>
        [HttpGet("{accidentId:guid}/expenses")]
        public async Task<IActionResult> GetExpenses(Guid accidentId)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            var expenses = await _context.Set<Accident_Expense>()
                .Where(e => e.AccidentId == accidentId)
                .OrderByDescending(e => e.CreatedAt)
                .ToListAsync();

            return Ok(expenses.Select(MapToExpenseDto));
        }

        /// <summary>
        /// POST: api/Accidents/{accidentId}/expenses
        /// Adds an expense to an accident
        /// </summary>
        [HttpPost("{accidentId:guid}/expenses")]
        public async Task<IActionResult> AddExpense(Guid accidentId, [FromForm] AccidentExpenseUploadDto dto)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            _logger.LogInformation("Adding expense to accident {AccidentId}", accidentId);

            string? filePath = null;

            // Handle file upload if provided
            if (dto.File != null && dto.File.Length > 0)
            {
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "Agencies", accident.AgencyId.ToString(), "Accident", accidentId.ToString());

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"expense_{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
                var fullPath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                filePath = $"/uploads/Agencies/{accident.AgencyId}/Accident/{accidentId}/{uniqueFileName}";
            }

            var expense = new Accident_Expense
            {
                Id = Guid.NewGuid(),
                AccidentId = accidentId,
                Name = dto.Name,
                Amount = dto.Amount,
                FilePath = filePath,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<Accident_Expense>().Add(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added expense {ExpenseId} to accident {AccidentId}", expense.Id, accidentId);
            return CreatedAtAction(nameof(GetExpenses), new { accidentId }, MapToExpenseDto(expense));
        }

        /// <summary>
        /// DELETE: api/Accidents/{accidentId}/expenses/{expenseId}
        /// Deletes an expense from an accident
        /// </summary>
        [HttpDelete("{accidentId:guid}/expenses/{expenseId:guid}")]
        public async Task<IActionResult> DeleteExpense(Guid accidentId, Guid expenseId)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            var expense = await _context.Set<Accident_Expense>()
                .FirstOrDefaultAsync(e => e.Id == expenseId && e.AccidentId == accidentId);

            if (expense == null)
                return NotFound(new { message = $"Expense '{expenseId}' not found." });

            // Delete file if exists
            if (!string.IsNullOrEmpty(expense.FilePath))
            {
                var fullPath = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory(), expense.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }

            _context.Set<Accident_Expense>().Remove(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted expense {ExpenseId} from accident {AccidentId}", expenseId, accidentId);
            return NoContent();
        }

        // ========================
        // === Refund Endpoints
        // ========================

        /// <summary>
        /// GET: api/Accidents/{accidentId}/refunds
        /// Gets all refunds for an accident
        /// </summary>
        [HttpGet("{accidentId:guid}/refunds")]
        public async Task<IActionResult> GetRefunds(Guid accidentId)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            var refunds = await _context.Set<Accident_Refund>()
                .Where(r => r.AccidentId == accidentId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return Ok(refunds.Select(MapToRefundDto));
        }

        /// <summary>
        /// POST: api/Accidents/{accidentId}/refunds
        /// Adds a refund to an accident
        /// </summary>
        [HttpPost("{accidentId:guid}/refunds")]
        public async Task<IActionResult> AddRefund(Guid accidentId, [FromForm] AccidentRefundUploadDto dto)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            _logger.LogInformation("Adding refund to accident {AccidentId}", accidentId);

            string? filePath = null;

            // Handle file upload if provided
            if (dto.File != null && dto.File.Length > 0)
            {
                var uploadsFolder = Path.Combine(
                    _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"),
                    "uploads", "Agencies", accident.AgencyId.ToString(), "Accident", accidentId.ToString());

                if (!Directory.Exists(uploadsFolder))
                    Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"refund_{Guid.NewGuid()}_{Path.GetFileName(dto.File.FileName)}";
                var fullPath = Path.Combine(uploadsFolder, uniqueFileName);

                using (var stream = new FileStream(fullPath, FileMode.Create))
                {
                    await dto.File.CopyToAsync(stream);
                }

                filePath = $"/uploads/Agencies/{accident.AgencyId}/Accident/{accidentId}/{uniqueFileName}";
            }

            var refund = new Accident_Refund
            {
                Id = Guid.NewGuid(),
                AccidentId = accidentId,
                Name = dto.Name,
                Amount = dto.Amount,
                FilePath = filePath,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<Accident_Refund>().Add(refund);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Added refund {RefundId} to accident {AccidentId}", refund.Id, accidentId);
            return CreatedAtAction(nameof(GetRefunds), new { accidentId }, MapToRefundDto(refund));
        }

        /// <summary>
        /// DELETE: api/Accidents/{accidentId}/refunds/{refundId}
        /// Deletes a refund from an accident
        /// </summary>
        [HttpDelete("{accidentId:guid}/refunds/{refundId:guid}")]
        public async Task<IActionResult> DeleteRefund(Guid accidentId, Guid refundId)
        {
            var accident = await _context.Set<Accident>().FindAsync(accidentId);
            if (accident == null)
                return NotFound(new { message = $"Accident '{accidentId}' not found." });

            if (!await _authService.HasAccessToAgencyAsync(accident.AgencyId))
                return Unauthorized();

            var refund = await _context.Set<Accident_Refund>()
                .FirstOrDefaultAsync(r => r.Id == refundId && r.AccidentId == accidentId);

            if (refund == null)
                return NotFound(new { message = $"Refund '{refundId}' not found." });

            // Delete file if exists
            if (!string.IsNullOrEmpty(refund.FilePath))
            {
                var fullPath = Path.Combine(_env.WebRootPath ?? Directory.GetCurrentDirectory(), refund.FilePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                }
            }

            _context.Set<Accident_Refund>().Remove(refund);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted refund {RefundId} from accident {AccidentId}", refundId, accidentId);
            return NoContent();
        }

        // ========================
        // === Mapping Methods
        // ========================

        private static AccidentDto MapToDto(Accident a) => new AccidentDto
        {
            Id = a.Id,
            AgencyId = a.AgencyId,
            AgencyName = a.Agency?.Name,
            CarId = a.CarId,
            CarInfo = a.Car != null ? new CarInfoDto
            {
                LicensePlate = a.Car.LicensePlate,
                Manufacturer = a.Car.Car_Model?.Manufacturer?.Name ?? "Unknown",
                Model = a.Car.Car_Model?.Name ?? "Unknown"
            } : null,
            ReservationId = a.ReservationId,
            AccidentDate = a.AccidentDate,
            Notes = a.Notes,
            Status = a.Status,
            ExpertFullname = a.ExpertFullname,
            ExpertPhone = a.ExpertPhone,
            CreatedByUserId = a.CreatedByUserId,
            CreatedByUserName = a.CreatedByUser?.FullName,
            CreatedAt = a.CreatedAt,
            Expenses = a.Accident_Expenses?.Select(MapToExpenseDto).ToList(),
            Refunds = a.Accident_Refunds?.Select(MapToRefundDto).ToList(),
            TotalExpenses = a.Accident_Expenses?.Sum(e => e.Amount) ?? 0,
            TotalRefunds = a.Accident_Refunds?.Sum(r => r.Amount) ?? 0
        };

        private static AccidentExpenseDto MapToExpenseDto(Accident_Expense e) => new AccidentExpenseDto
        {
            Id = e.Id,
            Name = e.Name,
            Amount = e.Amount,
            FilePath = e.FilePath,
            CreatedAt = e.CreatedAt
        };

        private static AccidentRefundDto MapToRefundDto(Accident_Refund r) => new AccidentRefundDto
        {
            Id = r.Id,
            Name = r.Name,
            Amount = r.Amount,
            FilePath = r.FilePath,
            CreatedAt = r.CreatedAt
        };

        // ========================
        // === DTOs
        // ========================

        public class AccidentDto
        {
            public Guid Id { get; set; }
            public Guid AgencyId { get; set; }
            public string? AgencyName { get; set; }
            public Guid CarId { get; set; }
            public CarInfoDto? CarInfo { get; set; }
            public Guid? ReservationId { get; set; }
            public DateTime AccidentDate { get; set; }
            public string Notes { get; set; }
            public Accident_Status Status { get; set; }
            public string? ExpertFullname { get; set; }
            public string? ExpertPhone { get; set; }
            public string? CreatedByUserId { get; set; }
            public string? CreatedByUserName { get; set; }
            public DateTime? CreatedAt { get; set; }
            public List<AccidentExpenseDto>? Expenses { get; set; }
            public List<AccidentRefundDto>? Refunds { get; set; }
            public double TotalExpenses { get; set; }
            public double TotalRefunds { get; set; }
        }

        public class CreateAccidentDto
        {
            [Required] public Guid AgencyId { get; set; }
            [Required] public Guid CarId { get; set; }
            public Guid? ReservationId { get; set; }
            [Required] public DateTime AccidentDate { get; set; }
            [Required] public string Notes { get; set; }
            public string? ExpertFullname { get; set; }
            public string? ExpertPhone { get; set; }
        }

        public class UpdateAccidentDto
        {
            [Required] public Guid Id { get; set; }
            [Required] public DateTime AccidentDate { get; set; }
            [Required] public string Notes { get; set; }
            public Accident_Status Status { get; set; }
            public string? ExpertFullname { get; set; }
            public string? ExpertPhone { get; set; }
        }

        public class AccidentExpenseDto
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
            public double Amount { get; set; }
            public string? FilePath { get; set; }
            public DateTime? CreatedAt { get; set; }
        }

        public class AccidentExpenseUploadDto
        {
            [Required] public string Name { get; set; }
            [Required] public double Amount { get; set; }
            public IFormFile? File { get; set; }
        }

        public class AccidentRefundDto
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
            public double Amount { get; set; }
            public string? FilePath { get; set; }
            public DateTime? CreatedAt { get; set; }
        }

        public class AccidentRefundUploadDto
        {
            [Required] public string Name { get; set; }
            [Required] public double Amount { get; set; }
            public IFormFile? File { get; set; }
        }

        public class CarInfoDto
        {
            public string LicensePlate { get; set; }
            public string Manufacturer { get; set; }
            public string Model { get; set; }
        }
    }
}