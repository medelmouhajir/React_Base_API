using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Data;
using React_Identity.Server.DTOs;
using React_Identity.Server.Models;
using React_Identity.Server.Services;

namespace React_Identity.Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly IdentityDbContext _context;
        private readonly IAuthService _authService;
        private readonly ILogger<AccountsController> _logger;

        public AccountsController(
            IdentityDbContext context,
            IAuthService authService,
            ILogger<AccountsController> logger)
        {
            _context = context;
            _authService = authService;
            _logger = logger;
        }

        [HttpPost]
        public async Task<ActionResult<AccountResponseDto>> CreateAccount(AccountCreateDto dto)
        {
            try
            {
                // Check if email already exists
                if (await _context.Accounts.AnyAsync(a => a.Email == dto.Email))
                {
                    return BadRequest(new ErrorResponseDto
                    {
                        ErrorCode = "EMAIL_EXISTS",
                        Message = "An account with this email already exists."
                    });
                }

                // Create new account
                var account = new Account
                {
                    AccountId = Guid.NewGuid(),
                    Email = dto.Email,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                // Hash password
                var (hash, salt) = _authService.HashPassword(dto.Password);
                account.PasswordHash = hash;
                account.PasswordSalt = salt;

                // Generate API key
                account.ApiKey = _authService.GenerateApiKey();

                _context.Accounts.Add(account);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Account created successfully for email: {Email}", dto.Email);

                return CreatedAtAction(nameof(GetAccount), new { id = account.AccountId },
                    MapToAccountResponse(account));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating account for email: {Email}", dto.Email);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while creating the account."
                });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<object>> Login(AccountLoginDto dto)
        {
            try
            {
                var account = await _context.Accounts
                    .FirstOrDefaultAsync(a => a.Email == dto.Email && a.IsActive);

                if (account == null || !_authService.VerifyPassword(dto.Password, account.PasswordHash, account.PasswordSalt))
                {
                    return Unauthorized(new ErrorResponseDto
                    {
                        ErrorCode = "INVALID_CREDENTIALS",
                        Message = "Invalid email or password."
                    });
                }

                // Update last login
                account.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = _authService.GenerateJwtToken(account);

                return Ok(new
                {
                    Token = token,
                    Account = MapToAccountResponse(account),
                    ExpiresAt = DateTime.UtcNow.AddHours(24)
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during login for email: {Email}", dto.Email);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred during login."
                });
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<ActionResult<AccountResponseDto>> GetAccount(Guid id)
        {
            var account = await _context.Accounts
                .Include(a => a.CallbackUrls)
                .Include(a => a.VerificationRequests)
                .FirstOrDefaultAsync(a => a.AccountId == id);

            if (account == null)
            {
                return NotFound(new ErrorResponseDto
                {
                    ErrorCode = "ACCOUNT_NOT_FOUND",
                    Message = "Account not found."
                });
            }

            return Ok(MapToAccountResponse(account));
        }

        [HttpPatch("{id}")]
        [Authorize]
        public async Task<ActionResult<AccountResponseDto>> UpdateAccount(Guid id, AccountUpdateDto dto)
        {
            var account = await _context.Accounts.FindAsync(id);
            if (account == null)
            {
                return NotFound(new ErrorResponseDto
                {
                    ErrorCode = "ACCOUNT_NOT_FOUND",
                    Message = "Account not found."
                });
            }

            try
            {
                // Update password if provided
                if (!string.IsNullOrEmpty(dto.NewPassword))
                {
                    if (string.IsNullOrEmpty(dto.CurrentPassword) ||
                        !_authService.VerifyPassword(dto.CurrentPassword, account.PasswordHash, account.PasswordSalt))
                    {
                        return BadRequest(new ErrorResponseDto
                        {
                            ErrorCode = "INVALID_CURRENT_PASSWORD",
                            Message = "Current password is incorrect."
                        });
                    }

                    var (hash, salt) = _authService.HashPassword(dto.NewPassword);
                    account.PasswordHash = hash;
                    account.PasswordSalt = salt;
                }

                // Update active status if provided
                if (dto.IsActive.HasValue)
                {
                    account.IsActive = dto.IsActive.Value;
                }

                await _context.SaveChangesAsync();
                return Ok(MapToAccountResponse(account));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating account: {AccountId}", id);
                return StatusCode(500, new ErrorResponseDto
                {
                    ErrorCode = "INTERNAL_ERROR",
                    Message = "An error occurred while updating the account."
                });
            }
        }

        private AccountResponseDto MapToAccountResponse(Account account)
        {
            return new AccountResponseDto
            {
                AccountId = account.AccountId,
                Email = account.Email,
                IsEmailVerified = account.IsEmailVerified,
                IsActive = account.IsActive,
                ApiKey = account.ApiKey,
                CreatedAt = account.CreatedAt,
                LastLoginAt = account.LastLoginAt,
                TotalVerifications = account.VerificationRequests?.Count ?? 0,
                ActiveCallbacks = account.CallbackUrls?.Count(c => c.IsActive) ?? 0
            };
        }
    }
}
