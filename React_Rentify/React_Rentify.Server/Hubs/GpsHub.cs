// React_Rentify.Server/Hubs/GpsHub.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Data;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace React_Rentify.Server.Hubs
{
    [Authorize]
    public class GpsHub : Hub
    {
        private readonly GpsDbContext _gpsContext;
        private readonly MainDbContext _mainContext;
        private readonly ILogger<GpsHub> _logger;

        // Track connections by agency
        private static readonly ConcurrentDictionary<string, HashSet<string>> _agencyConnections = new();

        public GpsHub(GpsDbContext gpsContext, MainDbContext mainContext, ILogger<GpsHub> logger)
        {
            _gpsContext = gpsContext;
            _mainContext = mainContext;
            _logger = logger;
        }

        public async Task JoinAgencyGroup(string agencyId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(agencyId))
            {
                _logger.LogWarning("Invalid user or agency ID for GPS connection");
                return;
            }

            // Verify user has access to this agency
            var user = await _mainContext.Users
                .FirstOrDefaultAsync(u => u.Id == userId && u.AgencyId.ToString() == agencyId);

            if (user == null)
            {
                _logger.LogWarning("User {UserId} unauthorized for agency {AgencyId}", userId, agencyId);
                await Clients.Caller.SendAsync("Error", "Unauthorized access to agency data");
                return;
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, $"Agency_{agencyId}");

            // Track connection
            _agencyConnections.AddOrUpdate(
                agencyId,
                new HashSet<string> { Context.ConnectionId },
                (key, existing) =>
                {
                    existing.Add(Context.ConnectionId);
                    return existing;
                }
            );

            _logger.LogInformation("User {UserId} joined GPS group for agency {AgencyId}", userId, agencyId);

            // Send initial vehicle data
            await SendInitialVehicleData(agencyId);
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Remove from all agency groups
            foreach (var kvp in _agencyConnections.ToList())
            {
                if (kvp.Value.Contains(Context.ConnectionId))
                {
                    kvp.Value.Remove(Context.ConnectionId);
                    if (kvp.Value.Count == 0)
                    {
                        _agencyConnections.TryRemove(kvp.Key, out _);
                    }
                    await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Agency_{kvp.Key}");
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        private async Task SendInitialVehicleData(string agencyId)
        {
            try
            {
                var vehicles = await _mainContext.Cars
                    .Include(x=> x.Car_Model)
                    .ThenInclude(x=> x.Manufacturer)
                    .Where(c => c.AgencyId.ToString() == agencyId && !string.IsNullOrEmpty(c.DeviceSerialNumber))
                    .Select(c => new
                    {
                        id = c.Id,
                        plateNumber = c.LicensePlate,
                        brand = c.Car_Model.Manufacturer.Name,
                        model = c.Car_Model.Name,
                        gpsSerial = c.DeviceSerialNumber
                    })
                    .ToListAsync();

                var vehicleUpdates = new List<object>();

                foreach (var vehicle in vehicles)
                {
                    var latestRecord = await _gpsContext.Location_Records
                        .Where(r => r.Gps_Device.DeviceSerialNumber == vehicle.gpsSerial)
                        .OrderByDescending(r => r.Timestamp)
                        .FirstOrDefaultAsync();

                    if (latestRecord != null)
                    {
                        vehicleUpdates.Add(new
                        {
                            vehicleId = vehicle.id,
                            update = new
                            {
                                latitude = latestRecord.Latitude,
                                longitude = latestRecord.Longitude,
                                speed = latestRecord.SpeedKmh,
                                ignitionOn = latestRecord.IgnitionOn,
                                batteryVoltage = 0,
                                gsmSignal = 0,
                                timestamp = latestRecord.Timestamp,
                                accuracy = 0
                            }
                        });
                    }
                }

                await Clients.Caller.SendAsync("InitialVehicleData", vehicleUpdates);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending initial vehicle data for agency {AgencyId}", agencyId);
            }
        }

        // Method to broadcast vehicle updates (called from GPS data processing)
        public static async Task BroadcastVehicleUpdate(IHubContext<GpsHub> hubContext, string agencyId, object vehicleUpdate)
        {
            await hubContext.Clients.Group($"Agency_{agencyId}")
                .SendAsync("VehicleUpdate", vehicleUpdate);
        }
    }
}