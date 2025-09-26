using Rentify_Server.Controllers.GPS;

namespace React_Rentify.Server.Controllers.GPS.Services
{
    public interface IGpsServiceCommunicator
    {
        Task<CommandResult> ControlIgnitionAsync(Guid deviceId, bool turnOn);
        Task<DeviceStatusResponse> GetDeviceStatusAsync(Guid deviceId);
    }

    public class CommandResult
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public bool CommandSent { get; set; }
    }
}
