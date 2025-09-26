using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Rentify_GPS_Service_Worker.Models
{
    public class Gps_Device
    {
        public Guid Id { get; set; }

        public string DeviceSerialNumber { get; set; }  // Primary Key (unique ID of device)
        public string Model { get; set; }               // Device model name
        public string InstallCarPlate { get; set; }     // (optional) Car plate for quick reference

        public string? IMEI { get; set; }
        public DateTime InstalledOn { get; set; }
        public DateTime? DeactivatedOn { get; set; }


        public virtual ICollection<Location_Record>? Location_Records { get; set; }

        public virtual ICollection<CommandQueue>? CommandQueues { get; set; }
    }
}
