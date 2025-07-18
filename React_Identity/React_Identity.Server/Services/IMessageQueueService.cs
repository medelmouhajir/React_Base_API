namespace React_Identity.Server.Services
{
    public interface IMessageQueueService
    {
        Task PublishAsync(string queue, object message);
        Task SubscribeAsync<T>(string queue, Func<T, Task> handler);
        Task StartAsync();
        Task StopAsync();
    }
}