using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Expenses;
using React_Rentify.Server.Models.Users;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ExpensesController : ControllerBase
    {
        private readonly MainDbContext _context;
        private readonly ILogger<ExpensesController> _logger;

        public ExpensesController(MainDbContext context, ILogger<ExpensesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ========================
        // === Expense Endpoints ==
        // ========================

        [HttpGet]
        public async Task<IActionResult> GetAllExpenses()
        {
            _logger.LogInformation("Retrieving all expenses");
            var expenses = await _context.Set<Expense>()
                .Include(e => e.Agency)
                .Include(e => e.Created_By)
                .Include(e => e.Expense_Category)
                .Include(e => e.Expense_Attachements)
                .ToListAsync();

            var dtos = expenses.Select(MapToExpenseDto).ToList();
            return Ok(dtos);
        }

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetExpenseById(Guid id)
        {
            _logger.LogInformation("Retrieving expense {ExpenseId}", id);
            var expense = await _context.Set<Expense>()
                .Include(e => e.Agency)
                .Include(e => e.Created_By)
                .Include(e => e.Expense_Category)
                .Include(e => e.Expense_Attachements)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
            {
                _logger.LogWarning("Expense {ExpenseId} not found", id);
                return NotFound(new { message = $"Expense '{id}' not found." });
            }

            return Ok(MapToExpenseDto(expense));
        }

        [HttpGet("agency/{agencyId:guid}")]
        public async Task<IActionResult> GetExpensesByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving expenses for agency {AgencyId}", agencyId);
            if (!await _context.Set<Agency>().AnyAsync(a => a.Id == agencyId))
                return NotFound(new { message = $"Agency '{agencyId}' does not exist." });

            var expenses = await _context.Set<Expense>()
                .Where(e => e.AgencyId == agencyId)
                .Include(e => e.Created_By)
                .Include(e => e.Expense_Category)
                .Include(e => e.Expense_Attachements)
                .ToListAsync();

            return Ok(expenses.Select(MapToExpenseDto));
        }

        [HttpPost]
        public async Task<IActionResult> CreateExpense([FromBody] CreateExpenseDto dto)
        {
            _logger.LogInformation("Creating expense for agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId))
                return BadRequest(new { message = $"Agency '{dto.AgencyId}' does not exist." });

            if (!await _context.Set<Expense_Category>().AnyAsync(c => c.Id == dto.Expense_CategoryId))
                return BadRequest(new { message = $"Category '{dto.Expense_CategoryId}' does not exist." });

            var expense = new Expense
            {
                Id = Guid.NewGuid(),
                Title = dto.Title,
                Description = dto.Description,
                Amount = dto.Amount,
                Created_At = DateTime.UtcNow,
                AgencyId = dto.AgencyId,
                Created_ById = dto.Created_ById,
                Expense_CategoryId = dto.Expense_CategoryId
            };

            _context.Set<Expense>().Add(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created expense {ExpenseId}", expense.Id);
            return CreatedAtAction(nameof(GetExpenseById), new { id = expense.Id }, MapToExpenseDto(expense));
        }

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateExpense(Guid id, [FromBody] UpdateExpenseDto dto)
        {
            _logger.LogInformation("Updating expense {ExpenseId}", id);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != dto.Id)
                return BadRequest(new { message = "URL id does not match payload id." });

            var existing = await _context.Set<Expense>().FirstOrDefaultAsync(e => e.Id == id);
            if (existing == null)
                return NotFound(new { message = $"Expense '{id}' not found." });

            if (!await _context.Set<Expense_Category>().AnyAsync(c => c.Id == dto.Expense_CategoryId))
                return BadRequest(new { message = $"Category '{dto.Expense_CategoryId}' does not exist." });

            // Update fields
            existing.Title = dto.Title;
            existing.Description = dto.Description;
            existing.Amount = dto.Amount;
            existing.Expense_CategoryId = dto.Expense_CategoryId;

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated expense {ExpenseId}", id);
            return Ok(MapToExpenseDto(existing));
        }

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteExpense(Guid id)
        {
            _logger.LogInformation("Deleting expense {ExpenseId}", id);

            var expense = await _context.Set<Expense>()
                .Include(e => e.Expense_Attachements)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (expense == null)
                return NotFound(new { message = $"Expense '{id}' not found." });

            // remove attachments first
            if (expense.Expense_Attachements != null && expense.Expense_Attachements.Any())
                _context.Set<Expense_Attachement>().RemoveRange(expense.Expense_Attachements);

            _context.Set<Expense>().Remove(expense);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted expense {ExpenseId}", id);
            return NoContent();
        }

        // =============================
        // === Category Endpoints ======
        // =============================

        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories()
        {
            _logger.LogInformation("Retrieving all expense categories");
            var cats = await _context.Set<Expense_Category>()
                .Include(c => c.Agency)
                .ToListAsync();

            return Ok(cats.Select(MapToCategoryDto));
        }

        [HttpGet("categories/{id:guid}")]
        public async Task<IActionResult> GetCategoryById(Guid id)
        {
            _logger.LogInformation("Retrieving category {CategoryId}", id);
            var cat = await _context.Set<Expense_Category>()
                .Include(c => c.Agency)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cat == null)
                return NotFound(new { message = $"Category '{id}' not found." });

            return Ok(MapToCategoryDto(cat));
        }

        [HttpGet("categories/agency/{agencyId:guid}")]
        public async Task<IActionResult> GetCategoriesByAgencyId(Guid agencyId)
        {
            _logger.LogInformation("Retrieving categories for agency {AgencyId}", agencyId);
            if (!await _context.Set<Agency>().AnyAsync(a => a.Id == agencyId))
                return NotFound(new { message = $"Agency '{agencyId}' does not exist." });

            var cats = await _context.Set<Expense_Category>()
                .Where(c => c.AgencyId == agencyId)
                .ToListAsync();

            return Ok(cats.Select(MapToCategoryDto));
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            _logger.LogInformation("Creating category for agency {AgencyId}", dto.AgencyId);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _context.Set<Agency>().AnyAsync(a => a.Id == dto.AgencyId))
                return BadRequest(new { message = $"Agency '{dto.AgencyId}' does not exist." });

            var cat = new Expense_Category
            {
                Id = Guid.NewGuid(),
                Name = dto.Name,
                AgencyId = dto.AgencyId
            };

            _context.Set<Expense_Category>().Add(cat);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created category {CategoryId}", cat.Id);
            return CreatedAtAction(nameof(GetCategoryById), new { id = cat.Id }, MapToCategoryDto(cat));
        }

        [HttpPut("categories/{id:guid}")]
        public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryDto dto)
        {
            _logger.LogInformation("Updating category {CategoryId}", id);

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != dto.Id)
                return BadRequest(new { message = "URL id does not match payload id." });

            var existing = await _context.Set<Expense_Category>().FirstOrDefaultAsync(c => c.Id == id);
            if (existing == null)
                return NotFound(new { message = $"Category '{id}' not found." });

            existing.Name = dto.Name;
            existing.AgencyId = dto.AgencyId;

            _context.Entry(existing).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated category {CategoryId}", id);
            return Ok(MapToCategoryDto(existing));
        }

        [HttpDelete("categories/{id:guid}")]
        public async Task<IActionResult> DeleteCategory(Guid id)
        {
            _logger.LogInformation("Deleting category {CategoryId}", id);

            var cat = await _context.Set<Expense_Category>()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cat == null)
                return NotFound(new { message = $"Category '{id}' not found." });

            _context.Set<Expense_Category>().Remove(cat);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted category {CategoryId}", id);
            return NoContent();
        }

        // =============================
        // === Mapping & DTO classes ==
        // =============================

        private static ExpenseDto MapToExpenseDto(Expense e) => new ExpenseDto
        {
            Id = e.Id,
            Title = e.Title,
            Description = e.Description,
            Amount = e.Amount,
            CreatedAt = e.Created_At,
            AgencyId = e.AgencyId,
            AgencyName = e.Agency?.Name,
            CreatedById = e.Created_ById,
            CreatedByName = e.Created_By?.FullName,
            CategoryId = e.Expense_CategoryId,
            CategoryName = e.Expense_Category?.Name,
            Attachments = e.Expense_Attachements?
                .Select(a => new ExpenseAttachmentDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    UrlPath = a.Url_Path,
                    CreatedAt = a.Created_At
                }).ToList()
        };

        private static ExpenseCategoryDto MapToCategoryDto(Expense_Category c) => new ExpenseCategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            AgencyId = c.AgencyId,
            AgencyName = c.Agency?.Name
        };

        public class ExpenseDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string? Description { get; set; }
            public decimal Amount { get; set; }
            public DateTime CreatedAt { get; set; }
            public Guid AgencyId { get; set; }
            public string? AgencyName { get; set; }
            public string CreatedById { get; set; }
            public string? CreatedByName { get; set; }
            public Guid CategoryId { get; set; }
            public string? CategoryName { get; set; }
            public List<ExpenseAttachmentDto>? Attachments { get; set; }
        }

        public class CreateExpenseDto
        {
            [Required] public string Title { get; set; }
            public string? Description { get; set; }
            [Required] public decimal Amount { get; set; }
            [Required] public Guid AgencyId { get; set; }
            [Required] public string Created_ById { get; set; }
            [Required] public Guid Expense_CategoryId { get; set; }
        }

        public class UpdateExpenseDto : CreateExpenseDto
        {
            [Required] public Guid Id { get; set; }
        }

        public class ExpenseAttachmentDto
        {
            public Guid Id { get; set; }
            public string Title { get; set; }
            public string UrlPath { get; set; }
            public DateTime CreatedAt { get; set; }
        }

        public class ExpenseCategoryDto
        {
            public Guid Id { get; set; }
            public string Name { get; set; }
            public Guid AgencyId { get; set; }
            public string? AgencyName { get; set; }
        }

        public class CreateCategoryDto
        {
            [Required] public string Name { get; set; }
            [Required] public Guid AgencyId { get; set; }
        }

        public class UpdateCategoryDto : CreateCategoryDto
        {
            [Required] public Guid Id { get; set; }
        }
    }
}
