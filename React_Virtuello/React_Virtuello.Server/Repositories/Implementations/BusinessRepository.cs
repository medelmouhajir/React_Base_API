using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Repositories.Interfaces;

namespace React_Virtuello.Server.Repositories.Implementations
{
    public class BusinessRepository : Repository<Business>, IBusinessRepository
    {
        public BusinessRepository(DbContext context) : base(context) { }

        public async Task<IEnumerable<Business>> GetByLocationAsync(double latitude, double longitude, double radiusKm, CancellationToken cancellationToken = default)
        {
            // Using Haversine formula for distance calculation
            return await _dbSet
                .Where(b => !b.IsDeleted)
                .Where(b =>
                    6371 * Math.Acos(
                        Math.Cos(latitude * Math.PI / 180) *
                        Math.Cos(b.Latitude * Math.PI / 180) *
                        Math.Cos((b.Longitude - longitude) * Math.PI / 180) +
                        Math.Sin(latitude * Math.PI / 180) *
                        Math.Sin(b.Latitude * Math.PI / 180)
                    ) <= radiusKm)
                .Include(b => b.Tags)
                .ThenInclude(bt => bt.Tag)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Business>> GetByOwnerAsync(string ownerId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(b => !b.IsDeleted && b.OwnerId == ownerId)
                .Include(b => b.Tags)
                .ThenInclude(bt => bt.Tag)
                .Include(b => b.Comments)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Business>> GetByTagsAsync(IEnumerable<Guid> tagIds, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(b => !b.IsDeleted)
                .Where(b => b.Tags.Any(bt => tagIds.Contains(bt.TagId)))
                .Include(b => b.Tags)
                .ThenInclude(bt => bt.Tag)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Business>> SearchAsync(string searchTerm, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(b => !b.IsDeleted)
                .Where(b => b.Name.Contains(searchTerm) ||
                           b.Description!.Contains(searchTerm) ||
                           b.Address!.Contains(searchTerm))
                .Include(b => b.Tags)
                .ThenInclude(bt => bt.Tag)
                .ToListAsync(cancellationToken);
        }
    }
}
