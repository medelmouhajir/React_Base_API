namespace React_Rentify.Server.Services
{
    public class SubscriptionBillingService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SubscriptionBillingService> _logger;

        public SubscriptionBillingService(IServiceProvider serviceProvider, ILogger<SubscriptionBillingService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _serviceProvider.CreateScope();
                var subscriptionService = scope.ServiceProvider.GetRequiredService<ISubscriptionService>();

                try
                {
                    // Process billing daily at 2 AM
                    var now = DateTime.UtcNow;
                    if (now.Hour == 2)
                    {
                        await ProcessDueBilling(subscriptionService);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error processing subscription billing");
                }

                await Task.Delay(TimeSpan.FromHours(1), stoppingToken); // Check hourly
            }
        }

        private async Task ProcessDueBilling(ISubscriptionService subscriptionService)
        {
            // Implementation for processing due subscriptions
            _logger.LogInformation("Processing subscription billing...");
        }
    }
}
