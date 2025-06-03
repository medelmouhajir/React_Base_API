using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Rentify_GPS_Service_Worker.Models
{
    public class Location_Record
    {
        public Guid Id { get; set; }

        public Guid Gps_DeviceId { get; set; }
        public virtual Gps_Device? Gps_Device { get; set; }


        public string DeviceSerialNumber { get; set; } // Identifier of the device/car
        public DateTime Timestamp { get; set; }

        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double SpeedKmh { get; set; }

        public double? Heading { get; set; }          // Direction of travel in degrees (0-359)
        public double? Altitude { get; set; }         // If provided by device
        public bool? IgnitionOn { get; set; }         // Example extra data: ignition status
        public string StatusFlags { get; set; }       // Any raw status or alert flags from device
    }
}
