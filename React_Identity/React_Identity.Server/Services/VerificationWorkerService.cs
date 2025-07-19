
using React_Identity.Server.Services;

namespace React_Identity.Server
{
    public class VerificationWorkerService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<VerificationWorkerService> _logger;

        public VerificationWorkerService(
            IServiceProvider serviceProvider,
            ILogger<VerificationWorkerService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Verification Worker Service started");

            try
            {
                using var scope = _serviceProvider.CreateScope();
                var messageQueue = scope.ServiceProvider.GetRequiredService<IMessageQueueService>();
                var verificationService = scope.ServiceProvider.GetRequiredService<IVerificationService>();
                Guid requestId = new Guid();
                // Subscribe to verification queues
                await messageQueue.SubscribeAsync<dynamic>("selfie.verification", async (message) =>
                {
                    if (message?.RequestId != null && Guid.TryParse(message.RequestId.ToString(), out requestId))
                    {
                        await verificationService.ProcessSelfieVerificationAsync(requestId);
                    }
                });

                await messageQueue.SubscribeAsync<dynamic>("document.verification", async (message) =>
                {
                    if (message?.RequestId != null && Guid.TryParse(message.RequestId.ToString(), out requestId))
                    {
                        await verificationService.ProcessDocumentVerificationAsync(requestId);
                    }
                });

                await messageQueue.SubscribeAsync<dynamic>("combined.verification", async (message) =>
                {
                    if (message?.RequestId != null && Guid.TryParse(message.RequestId.ToString(), out requestId))
                    {
                        await verificationService.ProcessCombinedVerificationAsync(requestId);
                    }
                });

                await messageQueue.StartAsync();

                // Keep the service running
                while (!stoppingToken.IsCancellationRequested)
                {
                    await Task.Delay(1000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Verification Worker Service");
            }
            finally
            {
                _logger.LogInformation("Verification Worker Service stopped");
            }
        }
    }
}