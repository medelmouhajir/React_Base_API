using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using React_Rentify.Server.Models.GPS.Commands;
using Rentify_Server.Controllers.GPS;

namespace React_Rentify.Server.Controllers.GPS.Services
{
    public class DatabaseGpsServiceCommunicator : IGpsServiceCommunicator
    {
        private readonly GpsDbContext _dbContext;
        private readonly ILogger<DatabaseGpsServiceCommunicator> _logger;

        public DatabaseGpsServiceCommunicator(
            GpsDbContext dbContext,
            ILogger<DatabaseGpsServiceCommunicator> logger)
        {
            _dbContext = dbContext;
            _logger = logger;
        }

        public async Task<CommandResult> ControlIgnitionAsync(Guid deviceId, bool turnOn)
        {
            try
            {
                var commandRequest = new CommandQueue
                {
                    Id = Guid.NewGuid(),
                    Gps_DeviceId = deviceId,
                    CommandType = turnOn ? CommandType.TURN_ON : CommandType.TURN_OFF,
                    CommandData = turnOn.ToString(),
                    Status = CommandStatus.PENDING,
                    CreatedAt = DateTime.UtcNow,
                    RequestedBy = "API"
                };

                _dbContext.CommandQueues.Add(commandRequest);
                await _dbContext.SaveChangesAsync();

                _logger.LogInformation("Queued ignition control command for Device Id {DeviceId}", deviceId);

                return new CommandResult
                {
                    Success = true,
                    Message = "Command queued successfully",
                    CommandSent = true
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue ignition command for Device Id {DeviceId}", deviceId);
                return new CommandResult
                {
                    Success = false,
                    Message = $"Database error: {ex.Message}",
                    CommandSent = false
                };
            }
        }

        public async Task<DeviceStatusResponse> GetDeviceStatusAsync(Guid deviceId)
        {
            var device = await _dbContext.Gps_Devices
                .FirstOrDefaultAsync(d => d.Id == deviceId);

            if (device == null)
            {
                return null;
            }

            var lastRecord = await _dbContext.Location_Records
                .Where(r => r.Gps_DeviceId == device.Id)
                .OrderByDescending(r => r.Timestamp)
                .FirstOrDefaultAsync();

            return new DeviceStatusResponse
            {
                Imei = device.IMEI,
                IsConnected = false,
                IgnitionStatus = lastRecord?.IgnitionOn
            };
        }
    }
}
