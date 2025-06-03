using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Rentify_GPS_Service_Worker.Data;
using Rentify_GPS_Service_Worker.Models;
using System;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace Rentify_GPS_Service_Worker
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly int _listenPort;
        private Socket _listenerSocket;

        public Worker(
            ILogger<Worker> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;

            // Read the UDP port from configuration (GpsListener:Port)
            _listenPort = configuration.GetValue<int>("GpsListener:Port");
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Run the listener loop in a separate Task
            return Task.Run(async () =>
            {
                // 1. Create a UDP socket
                _listenerSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);

                // Bind to all interfaces on the configured port
                _listenerSocket.Bind(new IPEndPoint(IPAddress.Any, _listenPort));
                _logger.LogInformation("GPS Listener started. Listening on UDP port {Port}", _listenPort);

                var buffer = new byte[4096];
                EndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);

                while (!stoppingToken.IsCancellationRequested)
                {
                    try
                    {
                        // 2. Wait for incoming UDP packet (blocking)
                        int receivedBytes = _listenerSocket.ReceiveFrom(buffer, ref remoteEP);
                        if (receivedBytes > 0)
                        {
                            // 3. Decode bytes → string
                            var rawData = Encoding.ASCII.GetString(buffer, 0, receivedBytes);
                            _logger.LogDebug("Received {Bytes} bytes from {RemoteEndPoint}: {Raw}",
                                receivedBytes, remoteEP, rawData);

                            // 4. Parse the raw message into a Location_Record object
                            var locationRecord = ParseGpsMessage(rawData);
                            if (locationRecord != null)
                            {
                                // 5. Save to database in a scoped context
                                await SaveLocationAsync(locationRecord, stoppingToken);
                            }
                        }
                    }
                    catch (SocketException sockEx)
                    {
                        _logger.LogError(sockEx, "SocketException in GPS listener.");
                        await Task.Delay(1000, stoppingToken);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Unexpected exception in GPS listener.");
                    }
                }
            }, stoppingToken);
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GPS Listener is stopping.");
            try
            {
                _listenerSocket?.Close();
            }
            catch { }
            return base.StopAsync(cancellationToken);
        }

        /// <summary>
        /// Parses a raw GPS message string into a Location_Record.
        /// Adjust this method based on your GPS device's protocol/format.
        /// Example format (comma‐separated): 
        ///   "DEVICE123,2025-06-03T22:00:00Z,33.589886,-7.603869,60.5,270"
        /// </summary>
        private Location_Record ParseGpsMessage(string raw)
        {
            try
            {
                // Split by comma (or by your device's delimiter)
                var parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries);

                if (parts.Length < 5)
                {
                    _logger.LogWarning("GPS message has insufficient parts: {Raw}", raw);
                    return null;
                }

                // Map each part (adjust indices if your format differs)
                string deviceSerial = parts[0].Trim();
                DateTime timestamp = DateTime.Parse(parts[1].Trim());
                double latitude = double.Parse(parts[2].Trim());
                double longitude = double.Parse(parts[3].Trim());
                double speedKmh = double.Parse(parts[4].Trim());

                double? heading = null;
                if (parts.Length >= 6 && double.TryParse(parts[5].Trim(), out var hdg))
                {
                    heading = hdg;
                }

                return new Location_Record
                {
                    DeviceSerialNumber = deviceSerial,
                    Timestamp = timestamp,
                    Latitude = latitude,
                    Longitude = longitude,
                    SpeedKmh = speedKmh,
                    Heading = heading
                    // You can set other fields (Altitude, IgnitionOn, etc.) if your message includes them
                };
            }
            catch (Exception parseEx)
            {
                _logger.LogWarning(parseEx, "Failed to parse GPS message: {Raw}", raw);
                return null;
            }
        }

        /// <summary>
        /// Saves the Location_Record into the database.
        /// Also ensures there's a corresponding Gps_Device row (inserts if missing).
        /// </summary>
        private async Task SaveLocationAsync(Location_Record locationRecord, CancellationToken token)
        {
            // Create a new scope to get a MainDbContext instance
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MainDbContext>();

            // 1. Check if this DeviceSerialNumber exists in the Gps_Devices table
            var device = await db.Gps_Devices
                                 .FirstOrDefaultAsync(d => d.DeviceSerialNumber == locationRecord.DeviceSerialNumber, token);

            if (device == null)
            {
                // If not found, create a new device entry
                device = new Gps_Device
                {
                    DeviceSerialNumber = locationRecord.DeviceSerialNumber,
                    Model = null,
                    InstallCarPlate = null,
                    InstalledOn = DateTime.UtcNow
                };
                db.Gps_Devices.Add(device);

                // Save so that device.Id is generated
                await db.SaveChangesAsync(token);
            }

            // 2. Assign foreign key
            locationRecord.Gps_DeviceId = device.Id;

            // 3. Insert the Location_Record
            db.Location_Records.Add(locationRecord);
            await db.SaveChangesAsync(token);

            _logger.LogInformation("Saved location for device {DeviceId} at {Time} ({Lat},{Lon})",
                device.DeviceSerialNumber, locationRecord.Timestamp, locationRecord.Latitude, locationRecord.Longitude);
        }
    }
}
