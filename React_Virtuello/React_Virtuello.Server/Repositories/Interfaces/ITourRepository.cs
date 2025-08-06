using React_Virtuello.Server.Models.Tours;

namespace React_Virtuello.Server.Repositories.Interfaces
{
    public interface ITourRepository : IRepository<Tour>
    {
        Task<Tour?> GetWithScenesAsync(Guid id, CancellationToken cancellationToken = default);
        Task<IEnumerable<Tour>> GetByOwnerAsync(string ownerId, CancellationToken cancellationToken = default);
    }
}
