using Microsoft.EntityFrameworkCore;
using Rentify_GPS_Service_Worker.Data;
using Rentify_GPS_Service_Worker.Models;
using Rentify_GPS_Service_Worker.Protocols.Teltonika.Commands;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Rentify_GPS_Service_Worker.Services
{
    public class CommandQueueProcessor : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CommandQueueProcessor> _logger;
        private readonly TimeSpan _pollInterval = TimeSpan.FromSeconds(5);

        public CommandQueueProcessor(
            IServiceProvider serviceProvider,
            ILogger<CommandQueueProcessor> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessPendingCommandsAsync(stoppingToken);
                    await Task.Delay(_pollInterval, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error in command queue processor");
                    await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
                }
            }
        }

        private async Task ProcessPendingCommandsAsync(CancellationToken cancellationToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<MainDbContext>();
            var commandSender = scope.ServiceProvider.GetRequiredService<TeltonikaCommandSender>();

            var pendingCommands = await dbContext.CommandQueues
                .Include(x=> x.Gps_Device)
                .Where(c => c.Status == Models.CommandStatus.PENDING)
                .OrderBy(c => c.CreatedAt)
                .Take(10)
                .ToListAsync(cancellationToken);

            foreach (var command in pendingCommands)
            {
                await ProcessCommandAsync(command, commandSender, dbContext);
            }

            if (pendingCommands.Count > 0)
            {
                await dbContext.SaveChangesAsync(cancellationToken);
            }
        }

        private async Task ProcessCommandAsync(
            CommandQueue command,
            TeltonikaCommandSender commandSender,
            MainDbContext dbContext)
        {
            try
            {
                command.ProcessedAt = DateTime.UtcNow;

                bool success = false;

                switch (command.CommandType)
                {
                    case CommandType.TURN_ON:
                        var turnOn = bool.Parse(command.CommandData);
                        success = await commandSender.ControlIgnitionAsync(command.Gps_Device.IMEI, turnOn);
                        break;

                    default:
                        _logger.LogWarning("Unknown command type: {CommandType}", command.CommandType);
                        break;
                }

                command.Status = success ? CommandStatus.COMPLETED : CommandStatus.FAILED;
                command.Result = success ? "Command sent successfully" : "Failed to send command";

                _logger.LogInformation("Processed command {CommandId} for device {IMEI}: {Status}",
                    command.Id, command.Gps_Device.IMEI, command.Status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to process command {CommandId}", command.Id);
                command.Status = CommandStatus.FAILED;
                command.Result = $"Error: {ex.Message}";
            }
        }
    }
}
