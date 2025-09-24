using System.Buffers.Binary;
using System.Collections.ObjectModel;

namespace Rentify_GPS_Service_Worker.Protocols.Teltonika
{
    public static class TeltonikaAvlDecoder
    {
        public const byte Codec8 = 0x08;
        public const byte Codec8Extended = 0x8E;

        public static bool TryParseAvlPayload(ReadOnlySpan<byte> payload, out TeltonikaAvlPacket packet, out string? error)
        {
            packet = default!;
            error = null;

            // payload here must start at codec (0x08 or 0x8E)
            if (payload.Length < 3) { error = "Payload too short"; return false; }

            byte codecId = payload[0];
            int recordCount = payload[1];
            if (recordCount <= 0) { error = "No AVL records present"; return false; }

            var records = new List<TeltonikaAvlRecord>(recordCount);
            int offset = 2;

            for (int i = 0; i < recordCount; i++)
            {
                if (!TryParseRecord(payload.Slice(offset), codecId, out var record, out int consumed, out var recErr))
                {
                    // Log the specific record that failed and try to continue with remaining records
                    error = $"Record {i}: {recErr}. Parsed {records.Count}/{recordCount} records successfully.";
                    break; // Stop parsing on first failure
                }

                records.Add(record);
                offset += consumed;
            }

            // If we parsed at least some records, consider it a partial success
            if (records.Count > 0)
            {
                // Check for confirmation byte if we have remaining data
                if (offset < payload.Length)
                {
                    byte confirmation = payload[offset];
                    // Don't fail if confirmation doesn't match - just log it
                    if (confirmation != recordCount && confirmation != records.Count)
                    {
                        error = $"Record count mismatch (expected {recordCount}, confirmation {confirmation}, parsed {records.Count})";
                    }
                }

                packet = new TeltonikaAvlPacket(codecId, records);
                return true;
            }

            return false;
        }

        private static bool TryParseRecord(ReadOnlySpan<byte> data, byte codecId, out TeltonikaAvlRecord record, out int consumed, out string? error)
        {
            record = default!;
            consumed = 0;
            error = null;

            const int minimumRecordLength = 26; // 8 + 1 + 15 + 2
            if (data.Length < minimumRecordLength)
            {
                error = $"Record too short (need {minimumRecordLength}, have {data.Length})";
                return false;
            }

            try
            {
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

                bool isExtendedCodec = codecId == Codec8Extended;
                int idSize = isExtendedCodec ? 2 : 1;

                // IO Element section
                if (data.Length < index + idSize + (isExtendedCodec ? 2 : 1))
                {
                    error = "IO block header truncated";
                    return false;
                }

                ushort eventIoId = isExtendedCodec
                    ? BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, idSize))
                    : data[index];
                index += idSize;

                ushort totalIoCount;
                if (isExtendedCodec)
                {
                    totalIoCount = BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, 2));
                    index += 2;
                }
                else
                {
                    totalIoCount = data[index];
                    index += 1;
                }

                ReadOnlySpan<byte> remainder = data.Slice(index);
                var ioElements = new Dictionary<int, long>();
                var variableIoElements = new Dictionary<int, byte[]>();

                // Try to parse IO elements - if this fails, we'll still return basic GPS data
                bool ioParseSuccess = true;
                string? ioError = null;

                try
                {
                    // Parse fixed-size IO groups
                    if (!TryParseFixedGroup(ref remainder, idSize, 1, ioElements, out ioError) ||
                        !TryParseFixedGroup(ref remainder, idSize, 2, ioElements, out ioError) ||
                        !TryParseFixedGroup(ref remainder, idSize, 4, ioElements, out ioError) ||
                        !TryParseFixedGroup(ref remainder, idSize, 8, ioElements, out ioError))
                    {
                        ioParseSuccess = false;
                    }

                    // Parse variable-size IO group (only for extended codec)
                    if (ioParseSuccess && isExtendedCodec && remainder.Length > 0)
                    {
                        if (!TryParseVariableGroup(ref remainder, variableIoElements, out ioError))
                        {
                            ioParseSuccess = false;
                        }
                    }
                }
                catch (Exception ex)
                {
                    ioParseSuccess = false;
                    ioError = ex.Message;
                }

                // Calculate consumed bytes - if IO parsing failed, estimate based on basic record structure
                if (ioParseSuccess)
                {
                    consumed = data.Length - remainder.Length;
                }
                else
                {
                    // Estimate consumption for failed IO parsing
                    consumed = Math.Min(index + 20, data.Length); // Conservative estimate
                }

                var timestampUtc = DateTimeOffset.FromUnixTimeMilliseconds(timestampMs).UtcDateTime;
                double latitude = rawLatitude / 10_000_000.0;
                double longitude = rawLongitude / 10_000_000.0;
                double altitude = rawAltitude;
                double speed = rawSpeed;
                double heading = rawAngle;

                record = new TeltonikaAvlRecord(
                    timestampUtc,
                    priority,
                    latitude,
                    longitude,
                    altitude,
                    speed,
                    heading,
                    satellites,
                    eventIoId,
                    (byte)Math.Min(totalIoCount, (ushort)255),
                    new ReadOnlyDictionary<int, long>(ioElements),
                    new ReadOnlyDictionary<int, byte[]>(variableIoElements));

                // If IO parsing failed, include that in the error but still return success
                if (!ioParseSuccess)
                {
                    error = $"IO parsing failed: {ioError}. GPS data parsed successfully.";
                }

                return true;
            }
            catch (Exception ex)
            {
                error = $"Record parsing exception: {ex.Message}";
                return false;
            }
        }

        private static bool TryParseFixedGroup(ref ReadOnlySpan<byte> buffer, int idSize, int valueSize, Dictionary<int, long> values, out string? error)
        {
            error = null;
            if (buffer.Length < 1)
            {
                error = "Missing IO element count";
                return false;
            }

            byte count = buffer[0];
            buffer = buffer.Slice(1);

            if (count == 0)
            {
                return true; // No elements in this group
            }

            for (int i = 0; i < count; i++)
            {
                if (buffer.Length < idSize + valueSize)
                {
                    error = $"IO element {i} truncated (need {idSize + valueSize} bytes, have {buffer.Length})";
                    return false;
                }

                int id = idSize == 1
                    ? buffer[0]
                    : BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, idSize));
                buffer = buffer.Slice(idSize);

                long value = valueSize switch
                {
                    1 => buffer[0],
                    2 => BinaryPrimitives.ReadInt16BigEndian(buffer.Slice(0, valueSize)),
                    4 => BinaryPrimitives.ReadInt32BigEndian(buffer.Slice(0, valueSize)),
                    8 => BinaryPrimitives.ReadInt64BigEndian(buffer.Slice(0, valueSize)),
                    _ => throw new InvalidOperationException($"Unsupported IO value size: {valueSize}")
                };

                buffer = buffer.Slice(valueSize);
                values[id] = value;
            }

            return true;
        }

        private static bool TryParseVariableGroup(ref ReadOnlySpan<byte> buffer, Dictionary<int, byte[]> values, out string? error)
        {
            error = null;

            if (buffer.Length < 1)
            {
                // No variable IO section
                return true;
            }

            byte count = buffer[0];
            buffer = buffer.Slice(1);

            if (count == 0)
            {
                return true; // No variable elements
            }

            for (int i = 0; i < count; i++)
            {
                if (buffer.Length < 4)
                {
                    error = $"Variable IO header {i} truncated (need 4 bytes, have {buffer.Length})";
                    return false;
                }

                int id = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));
                buffer = buffer.Slice(2);

                ushort length = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));
                buffer = buffer.Slice(2);

                // Sanity check for length
                if (length > 2048) // Increased max size but still reasonable
                {
                    error = $"Variable IO element {i} length too large: {length} bytes for ID 0x{id:X4}";
                    return false;
                }

                if (buffer.Length < length)
                {
                    error = $"Variable IO data {i} truncated (need {length} bytes, have {buffer.Length}) for ID 0x{id:X4}";
                    return false;
                }

                var valueBytes = buffer.Slice(0, length).ToArray();
                buffer = buffer.Slice(length);

                values[id] = valueBytes;
            }

            return true;
        }

        public static bool TryParsePacket(ReadOnlySpan<byte> frame, out TeltonikaAvlPacket packet, out string? error)
        {
            packet = default!;
            error = null;

            if (frame.Length < 12)
            {
                error = "Frame too short";
                return false;
            }

            int dataLength = BinaryPrimitives.ReadInt32BigEndian(frame.Slice(4, 4));
            if (dataLength <= 0)
            {
                error = $"Invalid data length {dataLength}";
                return false;
            }

            int totalLength = 8 + dataLength + 4;
            if (frame.Length < totalLength)
            {
                error = "Incomplete frame";
                return false;
            }

            var payload = frame.Slice(8, dataLength);
            return TryParseAvlPayload(payload, out packet, out error);
        }
    }

    public sealed class TeltonikaAvlPacket
    {
        public TeltonikaAvlPacket(byte codecId, IReadOnlyList<TeltonikaAvlRecord> records)
        {
            CodecId = codecId;
            Records = records;
        }

        public byte CodecId { get; }
        public int RecordCount => Records.Count;
        public IReadOnlyList<TeltonikaAvlRecord> Records { get; }
    }

    public sealed class TeltonikaAvlRecord
    {
        public TeltonikaAvlRecord(
            DateTime timestampUtc,
            byte priority,
            double latitude,
            double longitude,
            double altitude,
            double speedKmh,
            double heading,
            byte satellites,
            ushort eventIoId,
            byte totalIoElements,
            IReadOnlyDictionary<int, long> ioElements,
            IReadOnlyDictionary<int, byte[]> variableIoElements)
        {
            TimestampUtc = timestampUtc;
            Priority = priority;
            Latitude = latitude;
            Longitude = longitude;
            Altitude = altitude;
            SpeedKmh = speedKmh;
            Heading = heading;
            Satellites = satellites;
            EventIoId = eventIoId;
            TotalIoElements = totalIoElements;
            IoElements = ioElements;
            VariableIoElements = variableIoElements;
        }

        public DateTime TimestampUtc { get; }
        public byte Priority { get; }
        public double Latitude { get; }
        public double Longitude { get; }
        public double Altitude { get; }
        public double SpeedKmh { get; }
        public double Heading { get; }
        public byte Satellites { get; }
        public ushort EventIoId { get; }
        public byte TotalIoElements { get; }
        public IReadOnlyDictionary<int, long> IoElements { get; }
        public IReadOnlyDictionary<int, byte[]> VariableIoElements { get; }
    }
}