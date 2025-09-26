namespace Rentify_GPS_Service_Worker.Models
{
    public class CommandQueue
    {
        public Guid Id { get; set; }

        public CommandType CommandType { get; set; } = CommandType.UNKNOWN;
        public string CommandData { get; set; } = string.Empty;

        public CommandStatus Status { get; set; } = CommandStatus.PENDING;

        public DateTime CreatedAt { get; set; }
        public DateTime? ProcessedAt { get; set; }

        public string? RequestedBy { get; set; }
        public string? Result { get; set; }


        public Guid Gps_DeviceId { get; set; }
        public virtual Gps_Device? Gps_Device { get; set; }
    }

    public enum CommandStatus
    {
        PENDING = 0,
        SENT = 1,
        COMPLETED = 2,
        FAILED = 3
    }

    public enum CommandType
    {
        TURN_ON = 0,
        TURN_OFF = 1,

        UNKNOWN = 10
    }
}
