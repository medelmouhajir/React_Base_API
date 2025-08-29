using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using React_Rentify.Server.Models.Subscriptions;
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
        [HttpGet("plans/{planId:guid}")]
        public async Task<IActionResult> GetPlanById(Guid planId)
        {
            var plan = await _subscriptionService.GetPlanByIdAsync(planId);
            if (plan == null)
                return NotFound();

            return Ok(plan);
        }

        [HttpPost("plans")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreatePlan([FromBody] CreatePlanDto dto)
        {
            var plan = await _subscriptionService.CreatePlanAsync(dto);
            return CreatedAtAction(nameof(GetPlanById), new { planId = plan.Id }, plan);
        }

        [HttpPut("plans/{planId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdatePlan(Guid planId, [FromBody] UpdatePlanDto dto)
        {
            var plan = await _subscriptionService.UpdatePlanAsync(planId, dto);
            if (plan == null)
                return NotFound();

            return Ok(plan);
        }

        [HttpDelete("plans/{planId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeactivatePlan(Guid planId)
        {
            var result = await _subscriptionService.DeactivatePlanAsync(planId);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpPost("plans/{planId:guid}/activate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ActivatePlan(Guid planId)
        {
            var result = await _subscriptionService.ActivatePlanAsync(planId);
            if (!result)
                return NotFound();

            return NoContent();
        }

        [HttpGet("agency/{agencyId:guid}/history")]
        public async Task<IActionResult> GetSubscriptionHistory(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var history = await _subscriptionService.GetSubscriptionHistoryAsync(agencyId);
            return Ok(history);
        }

        [HttpGet("agency/{agencyId:guid}/invoices")]
        public async Task<IActionResult> GetSubscriptionInvoices(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var invoices = await _subscriptionService.GetSubscriptionInvoicesAsync(agencyId);
            return Ok(invoices);
        }

        [HttpGet("agency/{agencyId:guid}/usage")]
        public async Task<IActionResult> GetCurrentUsage(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var usage = await _subscriptionService.GetCurrentUsageAsync(agencyId);
            return Ok(usage);
        }

        [HttpPost("agency/{agencyId:guid}/resume")]
        public async Task<IActionResult> ResumeSubscription(Guid agencyId)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.ResumeSubscriptionAsync(agencyId);
            return Ok(subscription);
        }

        [HttpPost("agency/{agencyId:guid}/suspend")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> SuspendSubscription(Guid agencyId, [FromBody] SuspendSubscriptionDto dto)
        {
            var subscription = await _subscriptionService.SuspendSubscriptionAsync(agencyId, dto.Reason);
            if (subscription == null)
                return NotFound();

            return Ok(subscription);
        }

        [HttpPost("billing/process")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessBilling()
        {
            await _subscriptionService.ProcessAllSubscriptionBillingAsync();
            return Ok(new { message = "Billing processing completed" });
        }

        [HttpPost("billing/process/{subscriptionId:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ProcessSubscriptionBilling(Guid subscriptionId)
        {
            await _subscriptionService.ProcessSubscriptionBillingAsync(subscriptionId);
            return Ok(new { message = "Subscription billing processed" });
        }

        [HttpGet("agency/{agencyId:guid}/feature-access/{featureName}")]
        public async Task<IActionResult> CheckFeatureAccess(Guid agencyId, string featureName)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var hasAccess = await _subscriptionService.HasFeatureAccessAsync(agencyId, featureName);
            return Ok(new { hasAccess, featureName });
        }

        [HttpGet("agency/{agencyId:guid}/limits/{resourceType}")]
        public async Task<IActionResult> CheckResourceLimits(Guid agencyId, string resourceType, [FromQuery] int currentCount)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var isWithinLimits = await _subscriptionService.IsWithinLimitsAsync(agencyId, resourceType, currentCount);
            return Ok(new { isWithinLimits, resourceType, currentCount });
        }

        [HttpPost("agency/{agencyId:guid}/change-billing-cycle")]
        public async Task<IActionResult> ChangeBillingCycle(Guid agencyId, [FromBody] ChangeBillingCycleDto dto)
        {
            if (!await _authService.HasAccessToAgencyAsync(agencyId))
                return Unauthorized();

            var subscription = await _subscriptionService.ChangeBillingCycleAsync(agencyId, dto.NewBillingCycle);
            if (subscription == null)
                return NotFound();

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

    public class CreatePlanDto
    {
        public string Name { get; set; }
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public BillingCycle BillingCycle { get; set; }
        public int MaxCars { get; set; }
        public int MaxUsers { get; set; }
        public int MaxCustomers { get; set; }
        public int MaxReservations { get; set; }
        public bool HasMaintenanceModule { get; set; }
        public bool HasExpenseTracking { get; set; }
        public bool HasAdvancedReporting { get; set; }
        public bool HasAPIAccess { get; set; }
        public bool HasGPSTracking { get; set; }
    }

    public class UpdatePlanDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? Price { get; set; }
        public BillingCycle? BillingCycle { get; set; }
        public int? MaxCars { get; set; }
        public int? MaxUsers { get; set; }
        public int? MaxCustomers { get; set; }
        public int? MaxReservations { get; set; }
        public bool? HasMaintenanceModule { get; set; }
        public bool? HasExpenseTracking { get; set; }
        public bool? HasAdvancedReporting { get; set; }
        public bool? HasAPIAccess { get; set; }
        public bool? HasGPSTracking { get; set; }
    }

    public class SuspendSubscriptionDto
    {
        public string Reason { get; set; } = "Suspended by administrator";
    }

    public class ChangeBillingCycleDto
    {
        public BillingCycle NewBillingCycle { get; set; }
    }
}
