using React_Virtuello.Server.Models.Events;

namespace React_Virtuello.Server.Repositories.Interfaces
{
    public interface IEventRepository : IRepository<Event>
    {
        Task<IEnumerable<Event>> GetUpcomingEventsAsync(int take = 10, CancellationToken cancellationToken = default);
        Task<IEnumerable<Event>> GetEventsByDateRangeAsync(DateTime start, DateTime end, CancellationToken cancellationToken = default);
        Task<IEnumerable<Event>> GetEventsByOrganizerAsync(string organizerId, CancellationToken cancellationToken = default);
        Task<IEnumerable<Event>> GetEventsByCategoryAsync(Guid categoryId, CancellationToken cancellationToken = default);
    }
}
