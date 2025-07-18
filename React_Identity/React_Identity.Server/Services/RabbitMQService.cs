using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace React_Identity.Server.Services
{
    public class RabbitMQService : IMessageQueueService, IDisposable
    {
        private readonly IConnection _connection;
        private readonly IModel _channel;
        private readonly ILogger<RabbitMQService> _logger;
        private readonly Dictionary<string, object> _subscriptions = new();

        public RabbitMQService(IConfiguration configuration, ILogger<RabbitMQService> logger)
        {
            _logger = logger;

            var factory = new ConnectionFactory()
            {
                HostName = configuration["RabbitMQ:HostName"] ?? "localhost",
                Port = int.Parse(configuration["RabbitMQ:Port"] ?? "5672"),
                UserName = configuration["RabbitMQ:UserName"] ?? "guest",
                Password = configuration["RabbitMQ:Password"] ?? "guest"
            };

            try
            {
                _connection = factory.CreateConnection();
                _channel = _connection.CreateModel();
                _logger.LogInformation("Connected to RabbitMQ successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to RabbitMQ");
                throw;
            }
        }

        public async Task PublishAsync(string queue, object message)
        {
            try
            {
                // Declare queue
                _channel.QueueDeclare(
                    queue: queue,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                // Serialize message
                var json = JsonSerializer.Serialize(message);
                var body = Encoding.UTF8.GetBytes(json);

                // Set message properties
                var properties = _channel.CreateBasicProperties();
                properties.Persistent = true;
                properties.Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds());

                // Publish message
                _channel.BasicPublish(
                    exchange: "",
                    routingKey: queue,
                    basicProperties: properties,
                    body: body);

                _logger.LogInformation("Published message to queue: {Queue}", queue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error publishing message to queue: {Queue}", queue);
                throw;
            }
        }

        public async Task SubscribeAsync<T>(string queue, Func<T, Task> handler)
        {
            try
            {
                // Declare queue
                _channel.QueueDeclare(
                    queue: queue,
                    durable: true,
                    exclusive: false,
                    autoDelete: false,
                    arguments: null);

                // Set QoS
                _channel.BasicQos(prefetchSize: 0, prefetchCount: 1, global: false);

                // Create consumer
                var consumer = new EventingBasicConsumer(_channel);
                consumer.Received += async (model, ea) =>
                {
                    try
                    {
                        var body = ea.Body.ToArray();
                        var json = Encoding.UTF8.GetString(body);
                        var message = JsonSerializer.Deserialize<T>(json);

                        if (message != null)
                        {
                            await handler(message);
                            _channel.BasicAck(deliveryTag: ea.DeliveryTag, multiple: false);
                            _logger.LogInformation("Processed message from queue: {Queue}", queue);
                        }
                        else
                        {
                            _logger.LogWarning("Failed to deserialize message from queue: {Queue}", queue);
                            _channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: false);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error processing message from queue: {Queue}", queue);
                        _channel.BasicNack(deliveryTag: ea.DeliveryTag, multiple: false, requeue: true);
                    }
                };

                // Start consuming
                var consumerTag = _channel.BasicConsume(
                    queue: queue,
                    autoAck: false,
                    consumer: consumer);

                _subscriptions[queue] = consumerTag;
                _logger.LogInformation("Subscribed to queue: {Queue}", queue);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error subscribing to queue: {Queue}", queue);
                throw;
            }
        }

        public async Task StartAsync()
        {
            _logger.LogInformation("RabbitMQ service started");
        }

        public async Task StopAsync()
        {
            foreach (var subscription in _subscriptions)
            {
                try
                {
                    _channel.BasicCancel(subscription.Value.ToString());
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error canceling subscription for queue: {Queue}", subscription.Key);
                }
            }

            _subscriptions.Clear();
            _logger.LogInformation("RabbitMQ service stopped");
        }

        public void Dispose()
        {
            try
            {
                _channel?.Close();
                _connection?.Close();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error disposing RabbitMQ service");
            }
        }
    }
}