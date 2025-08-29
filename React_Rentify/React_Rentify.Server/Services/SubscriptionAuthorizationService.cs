using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Users;
using React_Rentify.Server.Models.Customers;

namespace React_Rentify.Server.Services
{
    public class SubscriptionAuthorizationService : ISubscriptionAuthorizationService
    {
        private readonly ISubscriptionService _subscriptionService;
        private readonly MainDbContext _context;

        public SubscriptionAuthorizationService(ISubscriptionService subscriptionService, MainDbContext context)
        {
            _subscriptionService = subscriptionService;
            _context = context;
        }

        public async Task<bool> CanAccessFeatureAsync(Guid agencyId, string feature)
        {
            return await _subscriptionService.HasFeatureAccessAsync(agencyId, feature);
        }

        public async Task<bool> CanCreateResourceAsync(Guid agencyId, string resourceType)
        {
            var currentCount = await GetResourceCountAsync(agencyId, resourceType);
            return await _subscriptionService.IsWithinLimitsAsync(agencyId, resourceType, currentCount);
        }

        public async Task ValidateFeatureAccessAsync(Guid agencyId, string feature)
        {
            if (!await CanAccessFeatureAsync(agencyId, feature))
            {
                throw new UnauthorizedAccessException($"Feature '{feature}' not available in current subscription plan");
            }
        }

        public async Task ValidateResourceLimitAsync(Guid agencyId, string resourceType)
        {
            var currentCount = await GetResourceCountAsync(agencyId, resourceType);

            if (!await _subscriptionService.IsWithinLimitsAsync(agencyId, resourceType, currentCount + 1))
            {
                throw new InvalidOperationException($"Resource limit exceeded for {resourceType}. Please upgrade your subscription.");
            }
        }

        private async Task<int> GetResourceCountAsync(Guid agencyId, string resourceType)
        {
            return resourceType switch
            {
                "cars" => await _context.Set<Car>().CountAsync(c => c.AgencyId == agencyId),
                "users" => await _context.Set<User>().CountAsync(u => u.AgencyId == agencyId),
                "customers" => await _context.Set<Customer>().CountAsync(c => c.AgencyId == agencyId),
                _ => 0
            };
        }
    }
}