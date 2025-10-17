using System.Text.Json.Serialization;

namespace React_Rentify.Server.DTOs.GPS
{
    public class VehicleCardDto
    {
        public Guid Id { get; init; }
        public string? PlateNumber { get; init; }
        public string Model { get; set; }
        public string Manufacturer { get; set; }
        public int Year { get; set; }
        public string LicensePlate { get; set; }
        public string Status { get; set; }
        public string MainImage { get; set; }

        public string? DeviceSerialNumber { get; init; }
        public string? DriverName { get; init; }
        public bool IsOnline { get; init; }
        public bool IsMoving { get; init; }

        // km/h
        public double? Speed { get; init; }

        // meters (your card divides by 1000 and .toFixed(1))
        public double? TotalDistance { get; init; }

        // ISO-8601 UTC
        public DateTimeOffset? LastUpdate { get; init; }

        public VehicleLocationDto? LastLocation { get; init; }

        public bool HasAlerts { get; init; }

        public int AlertsCount { get; init; }
    }

    public sealed class VehicleLocationDto
    {
        public string? Address { get; init; }

        public double? Latitude { get; init; }

        public double? Longitude { get; init; }
    }
}
