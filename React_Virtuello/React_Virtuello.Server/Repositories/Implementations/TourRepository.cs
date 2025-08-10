using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Repositories.Interfaces;

namespace React_Virtuello.Server.Repositories.Implementations
{
    public class TourRepository : Repository<Tour>, ITourRepository
    {
        public TourRepository(DbContext context) : base(context) { }

        public async Task<Tour?> GetWithScenesAsync(Guid id, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Include(t => t.Scenes)
                .ThenInclude(s => s.Hotspots)
                .FirstOrDefaultAsync(t => t.Id == id && !t.IsDeleted, cancellationToken);
        }

        public async Task<IEnumerable<Tour>> GetByOwnerAsync(string ownerId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(t => !t.IsDeleted && t.OwnerId == ownerId)
                .Include(t => t.Scenes)
                .ToListAsync(cancellationToken);
        }
    }
}