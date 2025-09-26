using System.Buffers.Binary;
using System.Collections.Concurrent;
using System.Net.Sockets;
using System.Text;

namespace Rentify_GPS_Service_Worker.Protocols.Teltonika.Commands
{
    public class TeltonikaCommandSender
    {
        private readonly ILogger<TeltonikaCommandSender> _logger;
        private readonly ConcurrentDictionary<string, TcpClient> _connectedClients;

        public TeltonikaCommandSender(ILogger<TeltonikaCommandSender> logger, ConcurrentDictionary<string, TcpClient> connectedClients)
        {
            _logger = logger;
            _connectedClients = connectedClients;
        }

        // Main method to control ignition remotely
        public async Task<bool> ControlIgnitionAsync(string deviceImei, bool turnOn, CancellationToken cancellationToken = default)
        {
            try
            {
                // For FMC920, ignition control is typically done through digital output 1 (DOUT1)
                // Command: setdigout 1 1 (turn on) or setdigout 1 0 (turn off)
                string command = $"setdigout 1 {(turnOn ? "1" : "0")}";

                _logger.LogInformation("Sending ignition control command to device {IMEI}: {Command}", deviceImei, command);

                return await SendCommandAsync(deviceImei, command, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to control ignition for device {IMEI}", deviceImei);
                return false;
            }
        }

        // Alternative method using SMS-style commands
        public async Task<bool> ControlIgnitionViaSmsCommandAsync(string deviceImei, bool turnOn, CancellationToken cancellationToken = default)
        {
            try
            {
                // FMC920 SMS command format for digital output control
                string command = turnOn ? "DOUT1:1" : "DOUT1:0";

                _logger.LogInformation("Sending SMS-style ignition control to device {IMEI}: {Command}", deviceImei, command);

                return await SendCommandAsync(deviceImei, command, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SMS-style ignition control for device {IMEI}", deviceImei);
                return false;
            }
        }

        private async Task<bool> SendCommandAsync(string deviceImei, string command, CancellationToken cancellationToken)
        {
            if (!_connectedClients.TryGetValue(deviceImei, out var tcpClient))
            {
                _logger.LogWarning("Device {IMEI} is not currently connected", deviceImei);
                return false;
            }

            if (!tcpClient.Connected)
            {
                _logger.LogWarning("Device {IMEI} TCP connection is not active", deviceImei);
                _connectedClients.TryRemove(deviceImei, out _);
                return false;
            }

            try
            {
                // Encode command using Codec 12 (command codec)
                byte[] commandPacket = EncodeCodec12Command(command);

                var stream = tcpClient.GetStream();
                await stream.WriteAsync(commandPacket, cancellationToken);
                await stream.FlushAsync(cancellationToken);

                _logger.LogInformation("Command sent successfully to device {IMEI}", deviceImei);

                // Wait for response with timeout
                var response = await ReadCommandResponseAsync(stream, cancellationToken);
                if (response != null)
                {
                    _logger.LogInformation("Received response from device {IMEI}: {Response}", deviceImei, response);
                    return response.Contains("OK") || response.Contains("1"); // Success indicators
                }

                return true; // Command sent successfully, no response expected
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send command to device {IMEI}", deviceImei);
                return false;
            }
        }

        private byte[] EncodeCodec12Command(string command)
        {
            // Codec 12 packet structure:
            // 4 bytes: 00 00 00 00 (preamble)
            // 4 bytes: data length
            // 1 byte: codec ID (0x0C for Codec 12)
            // 1 byte: command quantity (0x01)
            // 1 byte: command type (0x05 for command)
            // 4 bytes: command size
            // N bytes: command text
            // 1 byte: command quantity again (0x01)
            // 4 bytes: CRC-16

            byte[] commandBytes = Encoding.UTF8.GetBytes(command);
            int dataLength = 1 + 1 + 1 + 4 + commandBytes.Length + 1; // codec + qty + type + size + command + qty
            int totalLength = 8 + dataLength + 4; // preamble + data + crc

            byte[] packet = new byte[totalLength];
            int offset = 0;

            // Preamble (4 bytes of zeros)
            offset += 4;

            // Data length
            BinaryPrimitives.WriteInt32BigEndian(packet.AsSpan(offset), dataLength);
            offset += 4;

            // Codec ID (0x0C for Codec 12)
            packet[offset++] = 0x0C;

            // Command quantity
            packet[offset++] = 0x01;

            // Command type (0x05 for command)
            packet[offset++] = 0x05;

            // Command size
            BinaryPrimitives.WriteInt32BigEndian(packet.AsSpan(offset), commandBytes.Length);
            offset += 4;

            // Command text
            commandBytes.CopyTo(packet, offset);
            offset += commandBytes.Length;

            // Command quantity again
            packet[offset++] = 0x01;

            // Calculate CRC-16 for the data part (excluding preamble and CRC itself)
            ushort crc = CalculateCrc16(packet.AsSpan(8, dataLength));
            BinaryPrimitives.WriteUInt16BigEndian(packet.AsSpan(offset), crc);
            // Note: Last 2 bytes are padded as zeros for the full 4-byte CRC field

            return packet;
        }

        private async Task<string?> ReadCommandResponseAsync(NetworkStream stream, CancellationToken cancellationToken)
        {
            try
            {
                // Set a reasonable timeout for command response
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(10));
                using var combinedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                byte[] buffer = new byte[1024];
                int bytesRead = await stream.ReadAsync(buffer, combinedCts.Token);

                if (bytesRead > 0)
                {
                    // Try to parse Codec 12 response
                    if (TryParseCodec12Response(buffer.AsSpan(0, bytesRead), out string? response))
                    {
                        return response;
                    }
                }

                return null;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Command response timeout");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error reading command response");
                return null;
            }
        }

        private bool TryParseCodec12Response(ReadOnlySpan<byte> data, out string? response)
        {
            response = null;

            try
            {
                if (data.Length < 12) return false; // Minimum packet size

                // Skip preamble (4 bytes)
                int offset = 4;

                // Read data length
                int dataLength = BinaryPrimitives.ReadInt32BigEndian(data.Slice(offset));
                offset += 4;

                // Check codec ID
                if (data[offset] != 0x0C) return false; // Not Codec 12
                offset++;

                // Read response quantity
                byte responseQty = data[offset++];
                if (responseQty == 0) return true; // No response

                // Read response type
                byte responseType = data[offset++];

                // Read response size
                int responseSize = BinaryPrimitives.ReadInt32BigEndian(data.Slice(offset));
                offset += 4;

                if (offset + responseSize > data.Length) return false;

                // Extract response text
                response = Encoding.UTF8.GetString(data.Slice(offset, responseSize));
                return true;
            }
            catch
            {
                return false;
            }
        }

        private ushort CalculateCrc16(ReadOnlySpan<byte> data)
        {
            const ushort polynomial = 0xA001; // CRC-16-IBM polynomial
            ushort crc = 0;

            foreach (byte b in data)
            {
                crc ^= b;
                for (int i = 0; i < 8; i++)
                {
                    if ((crc & 1) != 0)
                        crc = (ushort)((crc >> 1) ^ polynomial);
                    else
                        crc >>= 1;
                }
            }

            return crc;
        }
    }
}