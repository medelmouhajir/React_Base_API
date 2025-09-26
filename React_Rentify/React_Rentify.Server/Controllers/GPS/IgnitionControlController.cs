using Microsoft.AspNetCore.Mvc;
using React_Rentify.Server.Controllers.GPS.Services;

namespace Rentify_Server.Controllers.GPS
{
    [ApiController]
    [Route("api/[controller]")]
    public class IgnitionControlController : ControllerBase
    {
        private readonly ILogger<IgnitionControlController> _logger;
        private readonly IGpsServiceCommunicator _gpsServiceCommunicator;

        public IgnitionControlController(
            ILogger<IgnitionControlController> logger,
            IGpsServiceCommunicator gpsServiceCommunicator)
        {
            _logger = logger;
            _gpsServiceCommunicator = gpsServiceCommunicator;
        }

        [HttpPost("{imei}/ignition")]
        public async Task<ActionResult<IgnitionControlResponse>> ControlIgnition(
            Guid deviceId,
            [FromBody] IgnitionControlRequest request)
        {
            try
            {
                _logger.LogInformation("Received ignition control request for Device Id {DeviceId}: {Action}",
                    deviceId, request.TurnOn ? "ON" : "OFF");

                var result = await _gpsServiceCommunicator.ControlIgnitionAsync(deviceId, request.TurnOn);

                return Ok(new IgnitionControlResponse
                {
                    Success = result.Success,
                    Message = result.Message,
                    CommandSent = result.CommandSent,
                    Timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue ignition command for Device Id {DeviceId}", deviceId);
                return StatusCode(500, new IgnitionControlResponse
                {
                    Success = false,
                    Message = "Internal server error occurred",
                    CommandSent = false,
                    Timestamp = DateTime.UtcNow
                });
            }
        }

        [HttpGet("{imei}/status")]
        public async Task<ActionResult<DeviceStatusResponse>> GetDeviceStatus(Guid deviceId)
        {
            try
            {
                var status = await _gpsServiceCommunicator.GetDeviceStatusAsync(deviceId);
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to queue ignition command for Device Id {DeviceId}", deviceId);
                return StatusCode(500, "Failed to retrieve device status");
            }
        }
    }

    // DTOs for the API
    public class IgnitionControlRequest
    {
        public bool TurnOn { get; set; }
    }

    public class IgnitionControlResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool CommandSent { get; set; }
        public DateTime Timestamp { get; set; }
    }

    public class DeviceStatusResponse
    {
        public string Imei { get; set; } = string.Empty;
        public bool IsConnected { get; set; }
        public bool? IgnitionStatus { get; set; }
        public DateTime LastSeen { get; set; }
        public string ConnectionType { get; set; } = string.Empty;
    }
}