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
        private readonly ConcurrentDictionary<string, string> _imeiToClientId;

        public TeltonikaCommandSender(
            ILogger<TeltonikaCommandSender> logger,
            ConcurrentDictionary<string, TcpClient> connectedClients,
            ConcurrentDictionary<string, string> imeiToClientId)
        {
            _logger = logger;
            _connectedClients = connectedClients;
            _imeiToClientId = imeiToClientId;
        }

        public async Task<bool> ControlIgnitionAsync(
            string deviceImei, bool turnOn, CancellationToken cancellationToken = default)
        {
            try
            {
                // FMC920 ignition control via DOUT1
                string command = $"setdigout 1 {(turnOn ? "1" : "0")}";

                _logger.LogInformation(
                    "Sending ignition control to device {IMEI}: {Command}",
                    deviceImei, command);

                return await SendCommandAsync(deviceImei, command, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to control ignition for device {IMEI}", deviceImei);
                return false;
            }
        }

        private async Task<bool> SendCommandAsync(
            string deviceImei, string command, CancellationToken cancellationToken)
        {
            // Get clientId from IMEI
            if (!_imeiToClientId.TryGetValue(deviceImei, out var clientId))
            {
                _logger.LogWarning("Device {IMEI} is not currently connected", deviceImei);
                return false;
            }

            // Get TCP client
            if (!_connectedClients.TryGetValue(clientId, out var tcpClient))
            {
                _logger.LogWarning(
                    "Device {IMEI} client {ClientId} not found in connections",
                    deviceImei, clientId);
                _imeiToClientId.TryRemove(deviceImei, out _);
                return false;
            }

            if (!tcpClient.Connected)
            {
                _logger.LogWarning("Device {IMEI} TCP connection is not active", deviceImei);
                _connectedClients.TryRemove(clientId, out _);
                _imeiToClientId.TryRemove(deviceImei, out _);
                return false;
            }

            try
            {
                // Encode command using Codec 12
                byte[] commandPacket = EncodeCodec12Command(command);

                var stream = tcpClient.GetStream();
                await stream.WriteAsync(commandPacket, cancellationToken);
                await stream.FlushAsync(cancellationToken);

                _logger.LogInformation("Command sent successfully to device {IMEI}", deviceImei);

                // Wait for response with timeout
                var response = await ReadCommandResponseAsync(stream, cancellationToken);

                if (response != null)
                {
                    _logger.LogInformation(
                        "Received response from device {IMEI}: {Response}",
                        deviceImei, BitConverter.ToString(response));
                    return true;
                }
                else
                {
                    _logger.LogWarning("No response received from device {IMEI}", deviceImei);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending command to device {IMEI}", deviceImei);
                return false;
            }
        }

        private byte[] EncodeCodec12Command(string command)
        {
            // Codec 12 format:
            // Preamble: 4 bytes (0x00000000)
            // Data Length: 4 bytes
            // Codec ID: 1 byte (0x0C for Codec 12)
            // Quantity 1: 1 byte (number of commands)
            // Command: variable
            // Quantity 2: 1 byte (same as Quantity 1)
            // CRC: 4 bytes

            byte[] commandBytes = Encoding.ASCII.GetBytes(command);
            int commandLength = commandBytes.Length;

            // Command structure: Type(1) + Length(4) + Command
            int commandStructSize = 1 + 4 + commandLength;

            // Data payload: CodecID(1) + Qty1(1) + Command + Qty2(1)
            int dataLength = 1 + 1 + commandStructSize + 1;

            // Total packet: Preamble(4) + DataLen(4) + Data + CRC(4)
            int totalLength = 4 + 4 + dataLength + 4;

            byte[] packet = new byte[totalLength];
            int idx = 0;

            // Preamble (4 zero bytes)
            idx += 4;

            // Data Length
            BinaryPrimitives.WriteInt32BigEndian(packet.AsSpan(idx, 4), dataLength);
            idx += 4;

            // Codec ID (0x0C for Codec 12)
            packet[idx++] = 0x0C;

            // Quantity 1
            packet[idx++] = 0x01;

            // Command Type (0x05 for text command)
            packet[idx++] = 0x05;

            // Command Length
            BinaryPrimitives.WriteInt32BigEndian(packet.AsSpan(idx, 4), commandLength);
            idx += 4;

            // Command bytes
            Buffer.BlockCopy(commandBytes, 0, packet, idx, commandLength);
            idx += commandLength;

            // Quantity 2
            packet[idx++] = 0x01;

            // Calculate CRC-16 for data portion (from Codec ID to end of data)
            ushort crc = CalculateCrc16(packet, 8, dataLength);
            BinaryPrimitives.WriteUInt32BigEndian(packet.AsSpan(idx, 4), crc);

            return packet;
        }

        private async Task<byte[]?> ReadCommandResponseAsync(
            NetworkStream stream, CancellationToken cancellationToken)
        {
            try
            {
                // Set read timeout
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(
                    cancellationToken, timeoutCts.Token);

                byte[] buffer = new byte[1024];
                int bytesRead = await stream.ReadAsync(buffer, linkedCts.Token);

                if (bytesRead > 0)
                {
                    byte[] response = new byte[bytesRead];
                    Buffer.BlockCopy(buffer, 0, response, 0, bytesRead);
                    return response;
                }

                return null;
            }
            catch (OperationCanceledException)
            {
                return null;
            }
        }

        private ushort CalculateCrc16(byte[] data, int offset, int length)
        {
            ushort crc = 0;
            for (int i = offset; i < offset + length; i++)
            {
                crc ^= (ushort)(data[i] << 8);
                for (int j = 0; j < 8; j++)
                {
                    if ((crc & 0x8000) != 0)
                        crc = (ushort)((crc << 1) ^ 0x1021);
                    else
                        crc <<= 1;
                }
            }
            return crc;
        }
    }
}