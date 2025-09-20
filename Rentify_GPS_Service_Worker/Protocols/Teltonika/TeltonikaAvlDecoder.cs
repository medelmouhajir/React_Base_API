using System.Buffers.Binary;
using System.Collections.ObjectModel;

namespace Rentify_GPS_Service_Worker.Protocols.Teltonika
{
    public static class TeltonikaAvlDecoder
    {
        public const byte Codec8 = 0x08;
        public const byte Codec8Extended = 0x8E;

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
            if (payload.Length < 3)
            {
                error = "Payload too short";
                return false;
            }

            byte codecId = payload[0];
            int recordCount = payload[1];
            if (recordCount <= 0)
            {
                error = "No AVL records present";
                return false;
            }

            var records = new List<TeltonikaAvlRecord>(recordCount);
            int offset = 2;
            for (int i = 0; i < recordCount; i++)
            {
                if (!TryParseRecord(payload.Slice(offset), codecId, out var record, out int consumed, out var recordError))
                {
                    error = $"Record {i}: {recordError}";
                    return false;
                }

                records.Add(record);
                offset += consumed;
            }

            if (offset >= payload.Length)
            {
                error = "Missing record count confirmation";
                return false;
            }

            byte confirmation = payload[offset];
            if (confirmation != recordCount)
            {
                error = $"Record count mismatch ({recordCount} != {confirmation})";
                return false;
            }

            packet = new TeltonikaAvlPacket(codecId, records);
            return true;
        }

        private static bool TryParseRecord(ReadOnlySpan<byte> data, byte codecId, out TeltonikaAvlRecord record, out int consumed, out string? error)
        {
            record = default!;
            consumed = 0;
            error = null;

            const int minimumRecordLength = 8 + 1 + 15 + 2;
            if (data.Length < minimumRecordLength)
            {
                error = "Record too short";
                return false;
            }

            long timestampMs = BinaryPrimitives.ReadInt64BigEndian(data.Slice(0, 8));
            byte priority = data[8];
            int index = 9;

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

            if (data.Length < index + idSize + 1)
            {
                error = "IO block truncated";
                return false;
            }

            ushort eventIoId = isExtendedCodec
                ? BinaryPrimitives.ReadUInt16BigEndian(data.Slice(index, idSize))
                : data[index];
            index += idSize;

            byte totalIo = data[index];
            index += 1;

            ReadOnlySpan<byte> remainder = data.Slice(index);
            var ioElements = new Dictionary<int, long>();
            var variableIoElements = isExtendedCodec ? new Dictionary<int, byte[]>() : new Dictionary<int, byte[]>();

            if (!TryParseFixedGroup(ref remainder, idSize, 1, ioElements, out error))
            {
                return false;
            }

            if (!TryParseFixedGroup(ref remainder, idSize, 2, ioElements, out error))
            {
                return false;
            }

            if (!TryParseFixedGroup(ref remainder, idSize, 4, ioElements, out error))
            {
                return false;
            }

            if (!TryParseFixedGroup(ref remainder, idSize, 8, ioElements, out error))
            {
                return false;
            }

            if (isExtendedCodec)
            {
                if (!TryParseVariableGroup(ref remainder, variableIoElements, out error))
                {
                    return false;
                }
            }

            consumed = data.Length - remainder.Length;

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
                totalIo,
                new ReadOnlyDictionary<int, long>(ioElements),
                new ReadOnlyDictionary<int, byte[]>(variableIoElements));

            return true;
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

            for (int i = 0; i < count; i++)
            {
                if (buffer.Length < idSize + valueSize)
                {
                    error = "IO element truncated";
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
                    _ => throw new InvalidOperationException("Unsupported IO value size")
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
                error = "Missing variable IO count";
                return false;
            }

            byte count = buffer[0];
            buffer = buffer.Slice(1);

            for (int i = 0; i < count; i++)
            {
                if (buffer.Length < 4)
                {
                    error = "Variable IO header truncated";
                    return false;
                }

                int id = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));
                buffer = buffer.Slice(2);

                ushort length = BinaryPrimitives.ReadUInt16BigEndian(buffer.Slice(0, 2));
                buffer = buffer.Slice(2);

                if (buffer.Length < length)
                {
                    error = "Variable IO data truncated";
                    return false;
                }

                var valueBytes = buffer.Slice(0, length).ToArray();
                buffer = buffer.Slice(length);

                values[id] = valueBytes;
            }

            return true;
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