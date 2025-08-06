using React_Virtuello.Server.Models.Businesses;

namespace React_Virtuello.Server.Repositories.Interfaces
{
    public interface IBusinessRepository : IRepository<Business>
    {
        Task<IEnumerable<Business>> GetByLocationAsync(double latitude, double longitude, double radiusKm, CancellationToken cancellationToken = default);
        Task<IEnumerable<Business>> GetByOwnerAsync(string ownerId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Business>> GetByTagsAsync(IEnumerable<Guid> tagIds, CancellationToken cancellationToken = default);
        Task<IEnumerable<Business>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default);
    }
}
