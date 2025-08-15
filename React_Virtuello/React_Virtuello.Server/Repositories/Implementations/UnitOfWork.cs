using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Data;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Repositories.Interfaces;

namespace React_Virtuello.Server.Repositories.Implementations
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly DbContext_Virtuello _context;

        private IBusinessRepository? _businessRepository;
        private IEventRepository? _eventRepository;
        private ITourRepository? _tourRepository;
        private IRepository<Tag>? _tagRepository;
        private IRepository<Event_Category>? _eventCategoryRepository;

        public UnitOfWork(DbContext_Virtuello context)
        {
            _context = context;
        }

        public IBusinessRepository Businesses => _businessRepository ??= new BusinessRepository(_context);
        public IEventRepository Events => _eventRepository ??= new EventRepository(_context);
        public ITourRepository Tours => _tourRepository ??= new TourRepository(_context);
        public IRepository<Tag> Tags => _tagRepository ??= new Repository<Tag>(_context);
        public IRepository<Event_Category> EventCategories => _eventCategoryRepository ??= new Repository<Event_Category>(_context);

        public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
            => await _context.SaveChangesAsync(cancellationToken);

        public async Task BeginTransactionAsync(CancellationToken cancellationToken = default)
            => await _context.Database.BeginTransactionAsync(cancellationToken);

        public async Task CommitTransactionAsync(CancellationToken cancellationToken = default)
            => await _context.Database.CommitTransactionAsync(cancellationToken);

        public async Task RollbackTransactionAsync(CancellationToken cancellationToken = default)
            => await _context.Database.RollbackTransactionAsync(cancellationToken);

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}