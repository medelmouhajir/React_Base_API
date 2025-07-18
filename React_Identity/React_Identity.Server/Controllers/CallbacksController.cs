using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.DTOs;
using React_Identity.Server.Models;

namespace React_Identity.Server.Controllers
{
    [Route("api/accounts/{accountId}/callbacks")]
    [ApiController]
    [Authorize]
    public class CallbacksController : ControllerBase
    {
        private readonly IdentityDbContext _context;
        private readonly ILogger<CallbacksController> _logger;

        public CallbacksController(IdentityDbContext context, ILogger<CallbacksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<CallbackResponseDto>> CreateCallback(Guid accountId, CallbackCreateDto dto)
        {
            // Verify account exists
            if (!await _context.Accounts.AnyAsync(a => a.AccountId == accountId))
            {
                return NotFound(new ErrorResponseDto
                {
                    ErrorCode = "ACCOUNT_NOT_FOUND",
                    Message = "Account not found."
                });
            }

            try
            {
                var callback = new CallbackUrl
                {
                    Url = dto.Url,
                    AccountId = accountId,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.CallbackUrls.Add(callback);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Callback URL created for account: {AccountId}", accountId);

                return CreatedAtAction(nameof(GetCallbacks), new { accountId },
                    new CallbackResponseDto
                    {
                        CallbackUrlId = callback.CallbackUrlId,
                        Url = callback.Url,
                        IsActive = callback.IsActive,
                        CreatedAt = callback.CreatedAt
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating callback for account: {AccountId}", accountId);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while creating the callback."
                });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<CallbackResponseDto>>> GetCallbacks(Guid accountId)
        {
            var callbacks = await _context.CallbackUrls
                .Where(c => c.AccountId == accountId)
                .Select(c => new CallbackResponseDto
                {
                    CallbackUrlId = c.CallbackUrlId,
                    Url = c.Url,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt
                })
                .ToListAsync();

            return Ok(callbacks);
        }

        [HttpDelete("{callbackId}")]
        public async Task<ActionResult> DeleteCallback(Guid accountId, int callbackId)
        {
            var callback = await _context.CallbackUrls
                .FirstOrDefaultAsync(c => c.CallbackUrlId == callbackId && c.AccountId == accountId);

            if (callback == null)
            {
                return NotFound(new ErrorResponseDto
                {
                    ErrorCode = "CALLBACK_NOT_FOUND",
                    Message = "Callback not found."
                });
            }

            _context.CallbackUrls.Remove(callback);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Callback URL deleted: {CallbackId} for account: {AccountId}", callbackId, accountId);

            return NoContent();
        }
    }
}