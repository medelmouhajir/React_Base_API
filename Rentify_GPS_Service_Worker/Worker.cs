using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Rentify_GPS_Service_Worker.Data;
using Rentify_GPS_Service_Worker.Models;
using System;
using System.Collections.Concurrent;
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
        private readonly string _serverIp;
        private Socket _udpSocket;
        private TcpListener _tcpListener;
        private CancellationTokenSource _internalCts;
        private readonly ConcurrentDictionary<string, TcpClient> _connectedClients = new();

        public Worker(
            ILogger<Worker> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;

            // Read the listening port from configuration
            _listenPort = configuration.GetValue<int>("GpsListener:Port");

            // In Docker, we should always bind to 0.0.0.0 (all interfaces)
            // The external IP (152.53.243.82) is handled by Docker port mapping
            _serverIp = "0.0.0.0";
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _internalCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            var combinedToken = _internalCts.Token;

            // Start both UDP and TCP listeners in separate tasks
            Task udpTask = StartUdpListener(combinedToken);
            Task tcpTask = StartTcpListener(combinedToken);

            // Return a task that completes when both listeners complete
            return Task.WhenAll(udpTask, tcpTask);
        }

        private Task StartUdpListener(CancellationToken token)
        {
            return Task.Run(async () =>
            {
                try
                {
                    // Create a UDP socket
                    _udpSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                    IPAddress bindAddress = _serverIp == "0.0.0.0" ? IPAddress.Any : IPAddress.Parse(_serverIp);

                    // Bind to the specified IP and port
                    _udpSocket.Bind(new IPEndPoint(bindAddress, _listenPort));
                    _logger.LogInformation("UDP GPS Listener started. Listening on {IP}:{Port}",
                        bindAddress, _listenPort);

                    var buffer = new byte[4096];
                    EndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);

                    while (!token.IsCancellationRequested)
                    {
                        try
                        {
                            // Wait for incoming UDP packet (blocking)
                            int receivedBytes = _udpSocket.ReceiveFrom(buffer, ref remoteEP);
                            if (receivedBytes > 0)
                            {
                                // Log the sender IP and port for debugging
                                var senderEndPoint = (IPEndPoint)remoteEP;

                                // Decode bytes → string
                                var rawData = Encoding.ASCII.GetString(buffer, 0, receivedBytes);
                                _logger.LogDebug("UDP: Received {Bytes} bytes from {IP}:{Port}: {Raw}",
                                    receivedBytes, senderEndPoint.Address, senderEndPoint.Port, rawData);

                                // Process the data
                                await ProcessGpsMessage(rawData, "UDP", senderEndPoint.ToString(), token);
                            }
                        }
                        catch (SocketException sockEx)
                        {
                            _logger.LogError(sockEx, "SocketException in UDP listener.");
                            await Task.Delay(1000, token);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Unexpected exception in UDP listener.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to start UDP listener");
                }
                finally
                {
                    _udpSocket?.Close();
                    _logger.LogInformation("UDP listener stopped");
                }
            }, token);
        }

        private Task StartTcpListener(CancellationToken token)
        {
            return Task.Run(async () =>
            {
                try
                {
                    // Create a TCP listener
                    IPAddress bindAddress = _serverIp == "0.0.0.0" ? IPAddress.Any : IPAddress.Parse(_serverIp);
                    _tcpListener = new TcpListener(bindAddress, _listenPort);
                    _tcpListener.Start();

                    _logger.LogInformation("TCP GPS Listener started. Listening on {IP}:{Port}",
                        bindAddress, _listenPort);

                    while (!token.IsCancellationRequested)
                    {
                        try
                        {
                            // Accept new TCP clients (non-blocking with cancellation)
                            using var timeoutCts = new CancellationTokenSource();
                            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(token, timeoutCts.Token);

                            // Set a timeout for accepting connections
                            timeoutCts.CancelAfter(TimeSpan.FromSeconds(1));

                            try
                            {
                                // Wait for a client to connect
                                var client = await _tcpListener.AcceptTcpClientAsync().WithCancellation(linkedCts.Token);

                                // Get client info for logging
                                var clientEndPoint = (IPEndPoint)client.Client.RemoteEndPoint;
                                var clientId = $"{clientEndPoint.Address}:{clientEndPoint.Port}";

                                _logger.LogInformation("New TCP client connected: {ClientId}", clientId);

                                // Add to connected clients dictionary
                                _connectedClients.TryAdd(clientId, client);

                                // Handle this client in a separate task
                                _ = HandleTcpClientAsync(client, clientId, token)
                                    .ContinueWith(t =>
                                    {
                                        if (t.IsFaulted)
                                            _logger.LogError(t.Exception, "Error handling TCP client {ClientId}", clientId);

                                        // Remove from dictionary when done
                                        _connectedClients.TryRemove(clientId, out _);
                                    }, TaskScheduler.Default);
                            }
                            catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                            {
                                // This is just the timeout, continue the loop
                                continue;
                            }
                        }
                        catch (SocketException sockEx)
                        {
                            _logger.LogError(sockEx, "SocketException in TCP listener.");
                            await Task.Delay(1000, token);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Unexpected exception in TCP listener.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to start TCP listener");
                }
                finally
                {
                    _tcpListener?.Stop();

                    // Close all client connections
                    foreach (var client in _connectedClients.Values)
                    {
                        try { client.Close(); } catch { }
                    }
                    _connectedClients.Clear();

                    _logger.LogInformation("TCP listener stopped");
                }
            }, token);
        }

        private async Task HandleTcpClientAsync(TcpClient client, string clientId, CancellationToken token)
        {
            try
            {
                using (client)
                {
                    // Get the client's stream
                    using var stream = client.GetStream();

                    // Buffer for reading data
                    byte[] buffer = new byte[4096];

                    // Set read timeout to prevent blocking forever
                    client.ReceiveTimeout = 30000; // 30 seconds

                    while (!token.IsCancellationRequested && client.Connected)
                    {
                        // Check if there's data available
                        if (stream.DataAvailable)
                        {
                            // Read data from the client
                            int bytesRead = await stream.ReadAsync(buffer, 0, buffer.Length, token);

                            if (bytesRead == 0)
                            {
                                // Client disconnected
                                _logger.LogInformation("TCP client disconnected: {ClientId}", clientId);
                                break;
                            }

                            // Convert data to string
                            var rawData = Encoding.ASCII.GetString(buffer, 0, bytesRead);
                            _logger.LogDebug("TCP: Received {Bytes} bytes from {ClientId}: {Raw}",
                                bytesRead, clientId, rawData);

                            // Process the GPS data
                            await ProcessGpsMessage(rawData, "TCP", clientId, token);

                            // Optionally send acknowledgment back to the client
                            // await SendAcknowledgment(stream, token);
                        }
                        else
                        {
                            // No data available, sleep briefly to avoid tight loop
                            await Task.Delay(100, token);
                        }
                    }
                }
            }
            catch (IOException ioEx)
            {
                // This typically happens when the client disconnects abruptly
                _logger.LogInformation(ioEx, "TCP client {ClientId} disconnected", clientId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling TCP client {ClientId}", clientId);
            }
            finally
            {
                // Ensure client is removed from dictionary
                _connectedClients.TryRemove(clientId, out _);
            }
        }

        // Optional: Send acknowledgment back to TCP client
        private async Task SendAcknowledgment(NetworkStream stream, CancellationToken token)
        {
            try
            {
                byte[] ackBytes = Encoding.ASCII.GetBytes("ACK\r\n");
                await stream.WriteAsync(ackBytes, 0, ackBytes.Length, token);
                await stream.FlushAsync(token);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send acknowledgment to TCP client");
            }
        }

        // Process GPS message regardless of source (TCP or UDP)
        private async Task ProcessGpsMessage(string rawData, string protocol, string clientId, CancellationToken token)
        {
            try
            {
                // Split into individual messages if multiple are received at once
                string[] messages = rawData.Split(
                    new[] { "\r\n", "\n" },
                    StringSplitOptions.RemoveEmptyEntries);

                foreach (var message in messages)
                {
                    // Parse the raw message into a Location_Record object
                    var locationRecord = ParseGpsMessage(message.Trim());
                    if (locationRecord != null)
                    {
                        // Add protocol and client info to status flags for debugging
                        locationRecord.StatusFlags = $"Protocol={protocol};ClientId={clientId}";

                        // Save to database
                        await SaveLocationAsync(locationRecord, token);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing GPS message from {Protocol} client {ClientId}",
                    protocol, clientId);
            }
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GPS Listener service is stopping.");

            try
            {
                // Cancel our internal operations
                _internalCts?.Cancel();

                // Close UDP socket
                _udpSocket?.Close();

                // Stop TCP listener
                _tcpListener?.Stop();

                // Close all TCP client connections
                foreach (var client in _connectedClients.Values)
                {
                    try { client.Close(); } catch { }
                }
                _connectedClients.Clear();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during service shutdown");
            }

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
                // Skip empty messages
                if (string.IsNullOrWhiteSpace(raw))
                {
                    return null;
                }

                // Trim any whitespace
                raw = raw.Trim();

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
                    Id = Guid.NewGuid(),
                    DeviceSerialNumber = deviceSerial,
                    Timestamp = timestamp,
                    Latitude = latitude,
                    Longitude = longitude,
                    SpeedKmh = speedKmh,
                    Heading = heading,
                    StatusFlags = string.Empty // Will be populated in ProcessGpsMessage
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
                    Id = Guid.NewGuid(),
                    DeviceSerialNumber = locationRecord.DeviceSerialNumber,
                    Model = "Unknown",  // Can be updated later
                    InstallCarPlate = "Unknown", // Can be updated later
                    InstalledOn = DateTime.UtcNow
                };
                db.Gps_Devices.Add(device);

                // Save so that device.Id is generated
                await db.SaveChangesAsync(token);

                _logger.LogInformation("Created new GPS device record for {DeviceSerial}", device.DeviceSerialNumber);
            }

            // 2. Assign foreign key
            locationRecord.Gps_DeviceId = device.Id;

            // 3. Insert the Location_Record
            db.Location_Records.Add(locationRecord);
            await db.SaveChangesAsync(token);

            _logger.LogInformation("Saved location for device {DeviceId} at {Time} ({Lat},{Lon}), Speed: {Speed} km/h",
                device.DeviceSerialNumber,
                locationRecord.Timestamp,
                locationRecord.Latitude,
                locationRecord.Longitude,
                locationRecord.SpeedKmh);
        }
    }

    // Extension method for TcpListener to support cancellation
    public static class TaskExtensions
    {
        public static async Task<T> WithCancellation<T>(this Task<T> task, CancellationToken cancellationToken)
        {
            var tcs = new TaskCompletionSource<bool>();
            using (cancellationToken.Register(s => ((TaskCompletionSource<bool>)s).TrySetResult(true), tcs))
            {
                if (task != await Task.WhenAny(task, tcs.Task))
                {
                    throw new OperationCanceledException(cancellationToken);
                }
            }
            return await task;
        }
    }
}