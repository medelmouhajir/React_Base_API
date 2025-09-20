using Rentify_GPS_Service_Worker.Protocols.Teltonika;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.Globalization;

namespace Rentify_GPS_Service_Worker.Protocols.Teltonika
{
    public static class TeltonikaEventInterpreter
    {
        private static readonly IReadOnlyDictionary<ushort, string> EventIdDescriptions = new ReadOnlyDictionary<ushort, string>(
            new Dictionary<ushort, string>
            {
                { 0, "Periodic tracking" },
                { 1, "Ignition change" },
                { 2, "Digital input 2 change" },
                { 3, "Digital input 3 change" },
                { 4, "Digital input 4 change" },
                { 5, "Analog input 1 change" },
                { 6, "Analog input 2 change" },
                { 16, "Alarm button" },
                { 21, "Geofence" },
                { 22, "Over speed" },
                { 24, "Trip start" },
                { 25, "Trip end" },
                { 33, "Crash detected" },
                { 36, "Unplug" },
                { 39, "Jamming" },
                { 45, "Eco score" },
                { 46, "Green driving" },
                { 47, "Green driving summary" },
                { 68, "Towing" },
                { 70, "Eco event" },
                { 71, "Speeding" },
                { 78, "Low internal battery" },
                { 79, "Internal battery removed" },
                { 80, "Internal battery low" },
                { 181, "Crash detected" },
                { 182, "Idling" },
                { 190, "Seatbelt" },
                { 237, "Auto geofence" },
                { 238, "Driver behaviour" },
                { 239, "Ignition" },
                { 245, "Harsh acceleration" },
                { 246, "Harsh braking" },
                { 247, "Harsh cornering" },
                { 248, "Towing" },
                { 249, "Accident detected" },
                { 250, "Excessive idling" },
                { 251, "Idling finished" },
                { 252, "Jamming detected" }
            });

        private static readonly TeltonikaIoEventDefinition[] IoEventDefinitions = new[]
        {
            new TeltonikaIoEventDefinition(
                IoId: 245,
                Tag: "HarshAcceleration",
                Description: "Harsh acceleration",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("HarshAccelerationScore", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 246,
                Tag: "HarshBraking",
                Description: "Harsh braking",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("HarshBrakingScore", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 247,
                Tag: "HarshCornering",
                Description: "Harsh cornering",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("HarshCorneringScore", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 248,
                Tag: "Towing",
                Description: "Towing detected",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => Array.Empty<KeyValuePair<string, string>>()),
            new TeltonikaIoEventDefinition(
                IoId: 249,
                Tag: "Accident",
                Description: "Accident detected",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("AccidentSeverity", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 250,
                Tag: "ExcessiveIdling",
                Description: "Excessive idling",
                PromoteToPrimary: false,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("IdleDuration", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 252,
                Tag: "Jamming",
                Description: "Jamming detected",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => Array.Empty<KeyValuePair<string, string>>()),
            new TeltonikaIoEventDefinition(
                IoId: 16,
                Tag: "AlarmButton",
                Description: "Alarm button pressed",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => Array.Empty<KeyValuePair<string, string>>()),
            new TeltonikaIoEventDefinition(
                IoId: 21,
                Tag: "Geofence",
                Description: "Geofence violation",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("GeofenceZone", value) }),
            new TeltonikaIoEventDefinition(
                IoId: 22,
                Tag: "Overspeed",
                Description: "Overspeed event",
                PromoteToPrimary: true,
                TriggerPredicate: value => value != 0,
                MetricsFactory: value => new [] { Metric("OverspeedDuration", value) })
        };

        public static TeltonikaEventInterpretation Interpret(TeltonikaAvlRecord record)
        {
            string? primary = null;
            if (EventIdDescriptions.TryGetValue(record.EventIoId, out var description))
            {
                primary = description;
            }

            var alerts = new List<string>();
            var metrics = new Dictionary<string, string>();

            foreach (var definition in IoEventDefinitions)
            {
                if (record.IoElements.TryGetValue(definition.IoId, out var rawValue) && definition.TriggerPredicate(rawValue))
                {
                    if (definition.PromoteToPrimary && string.IsNullOrEmpty(primary))
                    {
                        primary = definition.Description;
                    }

                    if (!alerts.Contains(definition.Tag))
                    {
                        alerts.Add(definition.Tag);
                    }

                    foreach (var metric in definition.MetricsFactory(rawValue))
                    {
                        metrics[metric.Key] = metric.Value;
                    }
                }
            }

            var readonlyAlerts = new ReadOnlyCollection<string>(alerts);
            var readonlyMetrics = new ReadOnlyDictionary<string, string>(metrics);

            return new TeltonikaEventInterpretation(primary, readonlyAlerts, readonlyMetrics);
        }

        private static KeyValuePair<string, string> Metric(string key, long value)
        {
            return new KeyValuePair<string, string>(key, value.ToString(CultureInfo.InvariantCulture));
        }

        private sealed record TeltonikaIoEventDefinition(
            int IoId,
            string Tag,
            string Description,
            bool PromoteToPrimary,
            Func<long, bool> TriggerPredicate,
            Func<long, IEnumerable<KeyValuePair<string, string>>> MetricsFactory);
    }

    public sealed record TeltonikaEventInterpretation(string? PrimaryEvent, IReadOnlyList<string> Alerts, IReadOnlyDictionary<string, string> Metrics);
}