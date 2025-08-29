namespace React_Rentify.Server.Services
{
    public interface ISubscriptionAuthorizationService
    {
        Task<bool> CanAccessFeatureAsync(Guid agencyId, string feature);
        Task<bool> CanCreateResourceAsync(Guid agencyId, string resourceType);
        Task ValidateFeatureAccessAsync(Guid agencyId, string feature);
        Task ValidateResourceLimitAsync(Guid agencyId, string resourceType);
    }
}