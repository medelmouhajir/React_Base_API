using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using React_Rentify.Server.Services;

namespace React_Rentify.Server.Controllers.App
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class SubscriptionsController : ControllerBase
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly IAgencyAuthorizationService _authService;
        private readonly ILogger<SubscriptionsController> _logger;

        public SubscriptionsController(
            ISubscriptionService subscriptionService,
            IAgencyAuthorizationService authService,
            ILogger<SubscriptionsController> logger)
        {
            _subscriptionService = subscriptionService;
            _authService = authService;
            _logger = logger;
        }

        [HttpGet("plans")]
        public async Task<IActionResult> GetAvailablePlans()
        {
            var plans = await _subscriptionService.GetAvailablePlansAsync();
            return Ok(plans);
        }

        [HttpGet("agency/{agencyId:guid}/current")]
        public async Task<IActionResult> GetCurrentSubscription(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.GetActiveSubscriptionAsync(agencyId);
            return Ok(subscription);
        }

        [HttpPost("agency/{agencyId:guid}/subscribe")]
        public async Task<IActionResult> CreateSubscription(Guid agencyId, [FromBody] CreateSubscriptionDto dto)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.CreateSubscriptionAsync(agencyId, dto.PlanId, dto.StartTrial);
            return CreatedAtAction(nameof(GetCurrentSubscription), new { agencyId }, subscription);
        }

        [HttpPut("agency/{agencyId:guid}/upgrade")]
        public async Task<IActionResult> UpgradeSubscription(Guid agencyId, [FromBody] UpgradeSubscriptionDto dto)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.UpgradeSubscriptionAsync(agencyId, dto.NewPlanId);
            return Ok(subscription);
        }

        [HttpDelete("agency/{agencyId:guid}/cancel")]
        public async Task<IActionResult> CancelSubscription(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.CancelSubscriptionAsync(agencyId);
            return Ok(subscription);
        }
    }

    public class CreateSubscriptionDto
    {
        public Guid PlanId { get; set; }
        public bool StartTrial { get; set; } = false;
    }

    public class UpgradeSubscriptionDto
    {
        public Guid NewPlanId { get; set; }
    }
}
