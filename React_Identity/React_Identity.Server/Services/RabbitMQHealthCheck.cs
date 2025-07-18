﻿
using Microsoft.Extensions.Diagnostics.HealthChecks;
using RabbitMQ.Client;

namespace React_Identity.Server
{
    public class RabbitMQHealthCheck : IHealthCheck
    {
        private readonly IConfiguration _configuration;

        public RabbitMQHealthCheck(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public Task<HealthCheckResult> CheckHealthAsync(
            HealthCheckContext context,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var factory = new ConnectionFactory()
                {
                    HostName = _configuration["RabbitMQ:HostName"] ?? "localhost",
                    Port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672"),
                    UserName = _configuration["RabbitMQ:UserName"] ?? "guest",
                    Password = _configuration["RabbitMQ:Password"] ?? "guest"
                };

                using var connection = factory.CreateConnection();
                using var channel = connection.CreateModel();

                return Task.FromResult(HealthCheckResult.Healthy("RabbitMQ is healthy"));
            }
            catch (Exception ex)
            {
                return Task.FromResult(HealthCheckResult.Unhealthy("RabbitMQ is unhealthy", ex));
            }
        }
    }
}