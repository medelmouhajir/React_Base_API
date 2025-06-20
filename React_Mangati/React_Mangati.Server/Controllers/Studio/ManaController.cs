using Microsoft.AspNetCore.Mvc;
using React_Mangati.Server.Data;
using React_Mangati.Server.Services;
using System.Security.Claims;

namespace React_Mangati.Server.Controllers.Studio
{
    public class ManaController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IManaService _manaService;

        public ManaController(ApplicationDbContext context, IManaService manaService)
        {
            _context = context;
            _manaService = manaService;
        }


        [HttpGet("balance")]
        public async Task<IActionResult> GetBalance()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var balance = await _manaService.GetBalanceAsync(userId);
            return Ok(new { balance, userId });
        }

        [HttpPost("purchase")]
        public async Task<IActionResult> PurchaseMana([FromBody] Purchase_Mana_Dto dto)
        {
            // Process payment via Stripe/PayPal
            // Add mana to user's balance
            // Return transaction details
            return Ok();
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactionHistory([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            // Return paginated transaction history
            return Ok();
        }

        [HttpGet("packages")]
        public async Task<IActionResult> GetManaPackages()
        {
            // Return available mana packages for purchase
            return Ok();
        }
    }

    public class Purchase_Mana_Dto
    {
        public int Amount { get; set; }
    }
}
