using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Models.Users;

namespace React_Virtuello.Server.Repositories.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IBusinessRepository Businesses { get; }
        IEventRepository Events { get; }
        ITourRepository Tours { get; }
        IRepository<Tag> Tags { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        Task BeginTransactionAsync(CancellationToken cancellationToken = default);
        Task CommitTransactionAsync(CancellationToken cancellationToken = default);
        Task RollbackTransactionAsync(CancellationToken cancellationToken = default);
    }
}
