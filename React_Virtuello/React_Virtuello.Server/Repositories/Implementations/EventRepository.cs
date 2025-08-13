using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Data;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Repositories.Interfaces;

namespace React_Virtuello.Server.Repositories.Implementations
{
    public class EventRepository : Repository<Event>, IEventRepository
    {
        public EventRepository(DbContext_Virtuello context) : base(context) { }

        public async Task<IEnumerable<Event>> GetUpcomingEventsAsync(int take = 10, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(e => !e.IsDeleted && e.Start > DateTime.UtcNow)
                .OrderBy(e => e.Start)
                .Take(take)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Event>> GetEventsByDateRangeAsync(DateTime start, DateTime end, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(e => !e.IsDeleted && e.Start >= start && e.Start <= end)
                .OrderBy(e => e.Start)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Event>> GetEventsByOrganizerAsync(string organizerId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(e => !e.IsDeleted && e.OrganizerId == organizerId)
                .ToListAsync(cancellationToken);
        }

        public async Task<IEnumerable<Event>> GetEventsByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default)
        {
            return await _dbSet
                .Where(e => !e.IsDeleted && e.EventCategoryId == categoryId)
                .ToListAsync(cancellationToken);
        }
    }
}