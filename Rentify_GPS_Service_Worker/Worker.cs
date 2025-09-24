using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Rentify_GPS_Service_Worker.Data;
using Rentify_GPS_Service_Worker.Models;
using Rentify_GPS_Service_Worker.Protocols;
using Rentify_GPS_Service_Worker.Protocols.Teltonika;
using System.Buffers.Binary;
using System.Collections.Concurrent;
using System.Collections.ObjectModel;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;

namespace Rentify_GPS_Service_Worker
{
    public class Worker : BackgroundService
    {
        private static readonly byte[] TcpHandshakeResponse = new byte[] { 0x01 };

        private readonly ILogger<Worker> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly int _listenPort;
        private readonly string _serverIp;
        private Socket? _udpSocket;
        private TcpListener? _tcpListener;
        private CancellationTokenSource? _internalCts;
        private readonly ConcurrentDictionary<string, TcpClient> _connectedClients = new();

        public Worker(
            ILogger<Worker> logger,
            IServiceProvider serviceProvider,
            IConfiguration configuration)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;

            _listenPort = configuration.GetValue<int>("GpsListener:Port");
            _serverIp = "0.0.0.0";
        }

        protected override Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _internalCts = CancellationTokenSource.CreateLinkedTokenSource(stoppingToken);
            var combinedToken = _internalCts.Token;

            Task udpTask = StartUdpListener(combinedToken);
            Task tcpTask = StartTcpListener(combinedToken);

            return Task.WhenAll(udpTask, tcpTask);
        }

        private Task StartUdpListener(CancellationToken token)
        {
            return Task.Run(async () =>
            {
                try
                {
                    _udpSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
                    IPAddress bindAddress = _serverIp == "0.0.0.0" ? IPAddress.Any : IPAddress.Parse(_serverIp);

                    _udpSocket.Bind(new IPEndPoint(bindAddress, _listenPort));
                    _logger.LogInformation("UDP GPS Listener started. Listening on {IP}:{Port}", bindAddress, _listenPort);

                    var buffer = new byte[65535];
                    EndPoint remoteEP = new IPEndPoint(IPAddress.Any, 0);

                    while (!token.IsCancellationRequested)
                    {
                        try
                        {
                            int receivedBytes = _udpSocket.ReceiveFrom(buffer, ref remoteEP);
                            if (receivedBytes <= 0)
                            {
                                continue;
                            }

                            var datagram = new byte[receivedBytes];
                            Buffer.BlockCopy(buffer, 0, datagram, 0, receivedBytes);

                            var senderEndPoint = (IPEndPoint)remoteEP;
                            await ProcessTeltonikaUdpPacketAsync(datagram, senderEndPoint, token);
                        }
                        catch (SocketException sockEx)
                        {
                            _logger.LogError(sockEx, "SocketException in UDP listener.");
                            await Task.Delay(1000, token);
                        }
                        catch (OperationCanceledException)
                        {
                            break;
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
                    IPAddress bindAddress = _serverIp == "0.0.0.0" ? IPAddress.Any : IPAddress.Parse(_serverIp);
                    _tcpListener = new TcpListener(bindAddress, _listenPort);
                    _tcpListener.Start();

                    _logger.LogInformation("TCP GPS Listener started. Listening on {IP}:{Port}", bindAddress, _listenPort);

                    while (!token.IsCancellationRequested)
                    {
                        try
                        {
                            using var timeoutCts = new CancellationTokenSource();
                            using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(token, timeoutCts.Token);

                            timeoutCts.CancelAfter(TimeSpan.FromSeconds(1));

                            try
                            {
                                var client = await _tcpListener.AcceptTcpClientAsync().WithCancellation(linkedCts.Token);

                                var clientEndPoint = (IPEndPoint)client.Client.RemoteEndPoint!;
                                var clientId = $"{clientEndPoint.Address}:{clientEndPoint.Port}";

                                _logger.LogInformation("New TCP client connected: {ClientId}", clientId);

                                _connectedClients.TryAdd(clientId, client);

                                _ = HandleTcpClientAsync(client, clientId, token).ContinueWith(t =>
                                {
                                    if (t.IsFaulted)
                                    {
                                        _logger.LogError(t.Exception, "Error handling TCP client {ClientId}", clientId);
                                    }

                                    _connectedClients.TryRemove(clientId, out _);
                                }, TaskScheduler.Default);
                            }
                            catch (OperationCanceledException) when (timeoutCts.IsCancellationRequested)
                            {
                                continue;
                            }
                        }
                        catch (SocketException sockEx)
                        {
                            _logger.LogError(sockEx, "SocketException in TCP listener.");
                            await Task.Delay(1000, token);
                        }
                        catch (OperationCanceledException)
                        {
                            break;
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
                    using var stream = client.GetStream();

                    var imei = await PerformTcpHandshakeAsync(stream, clientId, token);
                    if (string.IsNullOrWhiteSpace(imei))
                    {
                        _logger.LogWarning("TCP client {ClientId} closed because IMEI could not be determined", clientId);
                        return;
                    }

                    client.ReceiveTimeout = 30000;

                    var buffer = new byte[4096];
                    var connectionBuffer = new List<byte>();

                    while (!token.IsCancellationRequested && client.Connected)
                    {
                        int bytesRead = await stream.ReadAsync(buffer.AsMemory(0, buffer.Length), token);
                        if (bytesRead == 0)
                        {
                            _logger.LogInformation("TCP client disconnected: {ClientId}", clientId);
                            break;
                        }

                        // append only the bytes we actually read
                        for (int i = 0; i < bytesRead; i++)
                            connectionBuffer.Add(buffer[i]);

                        while (TryExtractTeltonikaFrame(connectionBuffer, out var frame))
                        {
                            if (!TeltonikaAvlDecoder.TryParsePacket(frame, out var packet, out var error))
                            {
                                _logger.LogWarning("Failed to parse Teltonika packet from {ClientId}: {Error}", clientId, error);
                                _logger.LogInformation(frame.ToString());
                                await SendTeltonikaAckAsync(stream, 0, token);
                                connectionBuffer.Clear();
                                return;
                            }

                            int saved = await PersistTeltonikaRecordsAsync(packet, imei, "TCP", clientId, token);
                            await SendTeltonikaAckAsync(stream, packet.RecordCount, token);
                        }
                    }
                }
            }
            catch (IOException ioEx)
            {
                _logger.LogInformation(ioEx, "TCP client {ClientId} disconnected", clientId);
            }
            catch (OperationCanceledException)
            {
                // normal shutdown
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error handling TCP client {ClientId}", clientId);
            }
            finally
            {
                _connectedClients.TryRemove(clientId, out _);
            }
        }


        private async Task<string?> PerformTcpHandshakeAsync(NetworkStream stream, string clientId, CancellationToken token)
        {
            var lengthBuffer = new byte[2];
            if (!await ReadExactAsync(stream, lengthBuffer, token))
            {
                _logger.LogWarning("TCP client {ClientId} closed before sending IMEI length", clientId);
                return null;
            }

            ushort imeiLength = BinaryPrimitives.ReadUInt16BigEndian(lengthBuffer);
            if (imeiLength == 0 || imeiLength > 64)
            {
                _logger.LogWarning("TCP client {ClientId} provided invalid IMEI length {Length}", clientId, imeiLength);
                return null;
            }

            var imeiBuffer = new byte[imeiLength];
            if (!await ReadExactAsync(stream, imeiBuffer, token))
            {
                _logger.LogWarning("TCP client {ClientId} closed before sending IMEI payload", clientId);
                return null;
            }

            string imei = Encoding.ASCII.GetString(imeiBuffer).Trim('\0', ' ');
            if (imei.Length == 0)
            {
                _logger.LogWarning("TCP client {ClientId} sent empty IMEI", clientId);
                return null;
            }

            await stream.WriteAsync(TcpHandshakeResponse, token);
            await stream.FlushAsync(token);

            _logger.LogInformation("TCP client {ClientId} identified as IMEI {IMEI}", clientId, imei);
            return imei;
        }


        private async Task ProcessTeltonikaUdpPacketAsync(byte[] datagram, IPEndPoint sender, CancellationToken token)
        {
            _logger.LogDebug("UDP raw datagram from {Sender}: {Data}",
                sender, BitConverter.ToString(datagram).Replace("-", " "));

            if (!TryParseTeltonikaUdpEnvelope(datagram, out var seq, out var imei, out var avl, out var envErr))
            {
                _logger.LogWarning("UDP: Envelope parse failed from {Sender}: {Error}", sender, envErr);

                // Try alternative parsing strategies
                if (TryParseAlternativeUdpFormat(datagram, out var altSeq, out var altImei, out var altAvl))
                {
                    _logger.LogInformation("UDP: Alternative format parsing succeeded for {Sender}", sender);
                    seq = altSeq;
                    imei = altImei;
                    avl = altAvl;
                }
                else
                {
                    SendTeltonikaUdpAck(0, sender);
                    return;
                }
            }

            _logger.LogInformation("UDP: Successfully parsed envelope. IMEI: {IMEI}, SeqId: {SeqId}, AVL Length: {AvlLength}",
                imei, seq, avl.Length);

            // Validate IMEI format
            if (!IsValidImei(imei))
            {
                _logger.LogWarning("UDP: Invalid IMEI format from {Sender}: {IMEI}", sender, imei);
                SendTeltonikaUdpAck(0, sender);
                return;
            }

            if (!TeltonikaAvlDecoder.TryParseAvlPayload(avl, out var packet, out var error))
            {
                _logger.LogWarning("UDP: Failed to parse AVL from {Sender}: {Error}", sender, error);

                // Try fallback parsing with more detailed logging
                if (TryParseWithFallback(avl, out var fallbackPacket, imei, sender))
                {
                    _logger.LogInformation("Fallback parsing succeeded with {RecordCount} records", fallbackPacket.RecordCount);
                    await PersistTeltonikaRecordsAsync(fallbackPacket, imei, "UDP", sender.ToString(), token);
                    SendTeltonikaUdpAck(fallbackPacket.RecordCount, sender);
                    return;
                }

                SendTeltonikaUdpAck(0, sender);
                return;
            }

            _logger.LogInformation("UDP: Successfully parsed {RecordCount} AVL records from IMEI {IMEI}",
                packet.RecordCount, imei);

            // Validate GPS data quality
            int validRecords = 0;
            foreach (var record in packet.Records)
            {
                var gpsValid = IsValidGpsCoordinate(record.Latitude, record.Longitude);
                if (gpsValid)
                {
                    validRecords++;
                }

                _logger.LogDebug("Record: Time={Time}, Lat={Lat:F6}, Lon={Lon:F6}, Speed={Speed}km/h, Sats={Sats}, Valid={Valid}",
                    record.TimestampUtc, record.Latitude, record.Longitude, record.SpeedKmh, record.Satellites, gpsValid);
            }

            _logger.LogInformation("UDP: {ValidRecords}/{TotalRecords} records have valid GPS coordinates",
                validRecords, packet.RecordCount);

            await PersistTeltonikaRecordsAsync(packet, imei, "UDP", sender.ToString(), token);
            SendTeltonikaUdpAck(packet.RecordCount, sender);
        }

        private static bool IsValidImei(string imei)
        {
            if (string.IsNullOrWhiteSpace(imei) || imei.Length != 15)
                return false;

            // Check if all characters are digits
            if (!imei.All(char.IsDigit))
                return false;

            // Luhn algorithm validation for IMEI
            int sum = 0;
            bool alternate = false;

            for (int i = imei.Length - 1; i >= 0; i--)
            {
                int digit = int.Parse(imei[i].ToString());

                if (alternate)
                {
                    digit *= 2;
                    if (digit > 9)
                        digit = (digit % 10) + 1;
                }

                sum += digit;
                alternate = !alternate;
            }

            return sum % 10 == 0;
        }

        private bool TryParseAlternativeUdpFormat(byte[] datagram, out byte seqId, out string imei, out byte[] avlPayload)
        {
            seqId = 0;
            imei = string.Empty;
            avlPayload = Array.Empty<byte>();

            try
            {
                // Sometimes the packet structure might be slightly different
                // Try parsing without magic bytes validation
                if (datagram.Length < 10)
                    return false;

                seqId = datagram[0];

                // Look for IMEI length marker - typically after the first few bytes
                for (int i = 4; i < Math.Min(10, datagram.Length - 17); i++)
                {
                    if (datagram[i] == 0x00 && datagram[i + 1] == 0x0F) // 15-byte IMEI
                    {
                        var imeiBytes = datagram.Skip(i + 2).Take(15).ToArray();
                        var candidateImei = Encoding.ASCII.GetString(imeiBytes);

                        if (IsValidImei(candidateImei))
                        {
                            imei = candidateImei;
                            avlPayload = datagram.Skip(i + 17).ToArray();
                            return true;
                        }
                    }
                }

                return false;
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidGpsCoordinate(double latitude, double longitude)
        {
            return latitude != 0 && longitude != 0 &&
                   latitude >= -90 && latitude <= 90 &&
                   longitude >= -180 && longitude <= 180;
        }

        private static bool TryParseTeltonikaUdpEnvelope(
    byte[] datagram,
    out byte seqId,
    out string imei,
    out byte[] avlPayload,
    out string? error)
        {
            seqId = 0;
            imei = string.Empty;
            avlPayload = Array.Empty<byte>();
            error = null;

            if (datagram.Length < 1 + 3 + 2 + 2)
            {
                error = "UDP datagram too short";
                return false;
            }

            int idx = 0;
            seqId = datagram[idx++];

            // Check for different magic byte patterns used by different Teltonika firmware versions
            var magicBytes = new byte[] { datagram[idx], datagram[idx + 1], datagram[idx + 2] };

            // Known magic patterns:
            // BE CA FE - Standard Teltonika UDP
            // 15 CA FE - Alternative pattern (some firmware versions)
            // CA FE BA - Another variant
            bool validMagic = false;

            if (magicBytes[0] == 0xBE && magicBytes[1] == 0xCA && magicBytes[2] == 0xFE)
            {
                validMagic = true;
            }
            else if (magicBytes[0] == 0x15 && magicBytes[1] == 0xCA && magicBytes[2] == 0xFE)
            {
                validMagic = true;
            }
            else if (magicBytes[0] == 0xCA && magicBytes[1] == 0xFE && magicBytes[2] == 0xBA)
            {
                validMagic = true;
            }

            if (!validMagic)
            {
                error = $"Unknown UDP magic bytes: {BitConverter.ToString(magicBytes).Replace("-", " ")}";
                return false;
            }

            idx += 3; // Skip magic bytes

            // Packet type/flags
            idx += 2;

            ushort imeiLen = BinaryPrimitives.ReadUInt16BigEndian(datagram.AsSpan(idx, 2));
            idx += 2;

            if (imeiLen == 0 || imeiLen > 64 || datagram.Length < idx + imeiLen)
            {
                error = $"Invalid IMEI length: {imeiLen}";
                return false;
            }

            imei = Encoding.ASCII.GetString(datagram, idx, imeiLen);
            idx += imeiLen;

            if (datagram.Length <= idx)
            {
                error = "No AVL payload";
                return false;
            }

            // Copy out payload so it's safe across awaits
            avlPayload = datagram.Skip(idx).ToArray();
            return true;
        }



        private async Task<int> PersistTeltonikaRecordsAsync(TeltonikaAvlPacket packet, string deviceSerial, string protocol, string clientId, CancellationToken token)
        {
            int saved = 0;

            foreach (var avlRecord in packet.Records)
            {
                var locationRecord = ConvertToLocationRecord(packet.CodecId, avlRecord, deviceSerial, protocol, clientId);
                await SaveLocationAsync(locationRecord, token);
                saved++;
            }

            return saved;
        }

        private Location_Record ConvertToLocationRecord(byte codecId, TeltonikaAvlRecord record, string deviceSerial, string protocol, string clientId)
        {
            return new Location_Record
            {
                Id = Guid.NewGuid(),
                DeviceSerialNumber = deviceSerial,
                Timestamp = record.TimestampUtc,
                Latitude = record.Latitude,
                Longitude = record.Longitude,
                SpeedKmh = record.SpeedKmh,
                Heading = record.Heading,
                Altitude = record.Altitude,
                IgnitionOn = ResolveIgnition(record),
                StatusFlags = BuildStatusFlags(codecId, record, protocol, clientId)
            };
        }

        private static bool? ResolveIgnition(TeltonikaAvlRecord record)
        {
            if (record.IoElements.TryGetValue(239, out var extendedIgnition))
            {
                return extendedIgnition != 0;
            }

            if (record.IoElements.TryGetValue(1, out var legacyIgnition))
            {
                return legacyIgnition != 0;
            }

            return null;
        }

        private static string BuildStatusFlags(byte codecId, TeltonikaAvlRecord record, string protocol, string clientId)
        {
            var builder = new StringBuilder();
            builder.Append($"Protocol=Teltonika/{protocol};Codec=0x{codecId:X};Client={clientId};Priority={record.Priority};Satellites={record.Satellites};Event={record.EventIoId}");

            var interpretation = TeltonikaEventInterpreter.Interpret(record);

            if (!string.IsNullOrEmpty(interpretation.PrimaryEvent))
            {
                builder.Append($";EventName={SanitizeToken(interpretation.PrimaryEvent)}");
            }

            if (interpretation.Alerts.Count > 0)
            {
                builder.Append($";Alerts={string.Join('|', interpretation.Alerts.Select(SanitizeToken))}");
            }

            foreach (var metric in interpretation.Metrics)
            {
                builder.Append($";{metric.Key}={metric.Value}");
            }

            if (record.TotalIoElements > 0)
            {
                builder.Append($";IO={record.TotalIoElements}");
            }

            if (record.IoElements.TryGetValue(66, out var io66))
            {
                builder.Append($";IO66={io66}");
            }

            if (record.IoElements.TryGetValue(67, out var io67))
            {
                builder.Append($";IO67={io67}");
            }

            if (record.IoElements.TryGetValue(72, out var fuelLevel))
            {
                builder.Append($";FuelLevel={fuelLevel}");
            }

            if (record.IoElements.TryGetValue(73, out var fuelUsed))
            {
                builder.Append($";FuelUsed={fuelUsed}");
            }

            if (record.IoElements.TryGetValue(239, out var ignitionRaw))
            {
                builder.Append($";IgnitionRaw={ignitionRaw}");
            }

            return builder.ToString();
        }

        private static string SanitizeToken(string value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return string.Empty;
            }

            var sanitized = value.Replace(';', '_').Replace('=', '_');
            var parts = sanitized
                .Split(new[] { ' ', '\t', '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);

            return string.Join('_', parts);
        }

        private static string? ExtractDeviceSerial(TeltonikaAvlPacket packet)
        {
            foreach (var record in packet.Records)
            {
                if (TryExtractImei(record, out var imei))
                {
                    return imei;
                }
            }

            return null;
        }

        private static bool TryExtractImei(TeltonikaAvlRecord record, out string? imei)
        {
            foreach (var variable in record.VariableIoElements)
            {
                var candidate = Encoding.ASCII.GetString(variable.Value).Trim('\0', ' ');
                if (IsImei(candidate))
                {
                    imei = candidate;
                    return true;
                }
            }

            foreach (var kvp in record.IoElements)
            {
                var value = kvp.Value;
                if (value >= 100_000_000_000_000 && value <= 999_999_999_999_999)
                {
                    var candidate = value.ToString(CultureInfo.InvariantCulture);
                    if (IsImei(candidate))
                    {
                        imei = candidate;
                        return true;
                    }
                }
            }

            imei = null;
            return false;
        }

        private static bool IsImei(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return false;
            }

            var trimmed = value.Trim();
            if (trimmed.Length != 15)
            {
                return false;
            }

            foreach (var ch in trimmed)
            {
                if (!char.IsDigit(ch))
                {
                    return false;
                }
            }

            return true;
        }

        private void SendTeltonikaUdpAck(int recordCount, IPEndPoint endpoint)
        {
            try
            {
                var ack = new byte[4];
                BinaryPrimitives.WriteInt32BigEndian(ack, recordCount);
                _udpSocket?.SendTo(ack, endpoint);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to send UDP acknowledgement to {Endpoint}", endpoint);
            }
        }

        private static async Task SendTeltonikaAckAsync(NetworkStream stream, int recordCount, CancellationToken token)
        {
            var ack = new byte[4];
            BinaryPrimitives.WriteInt32BigEndian(ack, recordCount);
            await stream.WriteAsync(ack, token);
            await stream.FlushAsync(token);
        }

        private static async Task<bool> ReadExactAsync(NetworkStream stream, Memory<byte> buffer, CancellationToken token)
        {
            int totalRead = 0;
            while (totalRead < buffer.Length)
            {
                int read = await stream.ReadAsync(buffer.Slice(totalRead), token);
                if (read == 0)
                {
                    return false;
                }

                totalRead += read;
            }

            return true;
        }

        private static bool TryExtractTeltonikaFrame(List<byte> buffer, out byte[] frame)
        {
            frame = Array.Empty<byte>();

            if (buffer.Count < 8)
            {
                return false;
            }

            var span = CollectionsMarshal.AsSpan(buffer);

            if (span[0] != 0 || span[1] != 0 || span[2] != 0 || span[3] != 0)
            {
                buffer.RemoveAt(0);
                return false;
            }

            int dataLength = BinaryPrimitives.ReadInt32BigEndian(span.Slice(4, 4));
            if (dataLength <= 0)
            {
                buffer.RemoveAt(0);
                return false;
            }

            int totalLength = 8 + dataLength + 4;
            if (span.Length < totalLength)
            {
                return false;
            }

            frame = span.Slice(0, totalLength).ToArray();
            buffer.RemoveRange(0, totalLength);
            return true;
        }

        public override Task StopAsync(CancellationToken cancellationToken)
        {
            _logger.LogInformation("GPS Listener service is stopping.");

            try
            {
                _internalCts?.Cancel();

                _udpSocket?.Close();
                _tcpListener?.Stop();

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

        private async Task SaveLocationAsync(Location_Record locationRecord, CancellationToken token)
        {
            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<MainDbContext>();

            var device = await db.Gps_Devices.FirstOrDefaultAsync(d => d.DeviceSerialNumber == locationRecord.DeviceSerialNumber, token);

            if (device == null)
            {
                device = new Gps_Device
                {
                    Id = Guid.NewGuid(),
                    DeviceSerialNumber = locationRecord.DeviceSerialNumber,
                    Model = "Unknown",
                    InstallCarPlate = "Unknown",
                    InstalledOn = DateTime.UtcNow
                };
                db.Gps_Devices.Add(device);

                await db.SaveChangesAsync(token);

                _logger.LogInformation("Created new GPS device record for {DeviceSerial}", device.DeviceSerialNumber);
            }

            locationRecord.Gps_DeviceId = device.Id;

            db.Location_Records.Add(locationRecord);
            await db.SaveChangesAsync(token);

            _logger.LogInformation("Saved location for device {DeviceId} at {Time} ({Lat},{Lon}), Speed: {Speed} km/h",
                device.DeviceSerialNumber,
                locationRecord.Timestamp,
                locationRecord.Latitude,
                locationRecord.Longitude,
                locationRecord.SpeedKmh);
        }
        private bool TryParseWithFallback(byte[] avl, out TeltonikaAvlPacket packet, string imei, IPEndPoint sender)
        {
            packet = default!;

            try
            {
                if (avl.Length < 3) return false;

                byte codecId = avl[0];
                int expectedRecordCount = avl[1];

                _logger.LogInformation("Fallback parser for {IMEI} from {Sender}: Codec=0x{Codec:X2}, Expected Records={Count}, Data Length={Length}",
                    imei, sender, codecId, expectedRecordCount, avl.Length);

                var records = new List<TeltonikaAvlRecord>();
                int offset = 2;

                // Try to parse as many records as possible with more lenient validation
                for (int i = 0; i < expectedRecordCount && offset < avl.Length - 30; i++)
                {
                    if (TryParseRecordBasic(avl.AsSpan(offset), codecId, out var record, out int consumed))
                    {
                        // Additional validation for reasonable GPS data
                        if (record.TimestampUtc > DateTime.UtcNow.AddDays(-30) &&
                            record.TimestampUtc < DateTime.UtcNow.AddHours(1))
                        {
                            records.Add(record);
                            _logger.LogDebug("Fallback parsed valid record {Index}: Time={Time}, Lat={Lat:F6}, Lon={Lon:F6}, Speed={Speed}km/h",
                                i, record.TimestampUtc, record.Latitude, record.Longitude, record.SpeedKmh);
                        }
                        else
                        {
                            _logger.LogDebug("Fallback skipped record {Index} with invalid timestamp: {Time}", i, record.TimestampUtc);
                        }

                        offset += consumed;
                    }
                    else
                    {
                        _logger.LogDebug("Fallback parser stopped at record {Index}", i);
                        break;
                    }
                }

                if (records.Count > 0)
                {
                    packet = new TeltonikaAvlPacket(codecId, records);
                    _logger.LogInformation("Fallback parser success for {IMEI}: {ParsedCount}/{ExpectedCount} records",
                        imei, records.Count, expectedRecordCount);
                    return true;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallback parsing failed for {IMEI} from {Sender}", imei, sender);
            }

            return false;
        }

        private bool TryParseRecordBasic(ReadOnlySpan<byte> data, byte codecId, out TeltonikaAvlRecord record, out int consumed)
        {
            record = default!;
            consumed = 0;

            try
            {
                if (data.Length < 26) return false;

                long timestampMs = BinaryPrimitives.ReadInt64BigEndian(data.Slice(0, 8));
                byte priority = data[8];
                int index = 9;

                // GPS Element
                int rawLongitude = BinaryPrimitives.ReadInt32BigEndian(data.Slice(index, 4));
                index += 4;
                int rawLatitude = BinaryPrimitives.ReadInt32BigEndian(data.Slice(index, 4));
                index += 4;
                short rawAltitude = BinaryPrimitives.ReadInt16BigEndian(data.Slice(index, 2));
                index += 2;
                ushort rawAngle = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, 2));
                index += 2;
                byte satellites = data[index];
                index += 1;
                ushort rawSpeed = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, 2));
                index += 2;

                bool isExtendedCodec = codecId == TeltonikaAvlDecoder.Codec8Extended;
                int idSize = isExtendedCodec ? 2 : 1;

                if (data.Length < index + idSize + 1) return false;

                ushort eventIoId = isExtendedCodec
                    ? BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, idSize))
                    : data[index];
                index += idSize;

                // Skip totalIoCount parsing for basic fallback
                if (isExtendedCodec && data.Length >= index + 2)
                {
                    index += 2; // Skip 2-byte totalIoCount
                }
                else if (!isExtendedCodec && data.Length >= index + 1)
                {
                    index += 1; // Skip 1-byte totalIoCount
                }

                // For basic parsing, we'll estimate consumed bytes based on typical record sizes
                // Most FMC920 records are around 80-120 bytes
                consumed = Math.Min(85, data.Length - 10); // Conservative estimate leaving buffer

                var timestampUtc = DateTimeOffset.FromUnixTimeMilliseconds(timestampMs).UtcDateTime;
                double latitude = rawLatitude / 10_000_000.0;
                double longitude = rawLongitude / 10_000_000.0;

                record = new TeltonikaAvlRecord(
                    timestampUtc,
                    priority,
                    latitude,
                    longitude,
                    rawAltitude,
                    rawSpeed,
                    rawAngle,
                    satellites,
                    eventIoId,
                    0, // totalIoElements
                    new ReadOnlyDictionary<int, long>(new Dictionary<int, long>()),
                    new ReadOnlyDictionary<int, byte[]>(new Dictionary<int, byte[]>()));

                return true;
            }
            catch
            {
                return false;
            }
        }

    }

    public static class TaskExtensions
    {
        public static async Task<T> WithCancellation<T>(this Task<T> task, CancellationToken cancellationToken)
        {
            var tcs = new TaskCompletionSource<bool>();
            using (cancellationToken.Register(static s => ((TaskCompletionSource<bool>)s!).TrySetResult(true), tcs))
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