using React_Rentify.Server.Models.GPS.Records;

namespace React_Rentify.Server.Models.GPS
{
    public class Gps_Device
    {
        public Guid Id { get; set; }

        public string DeviceSerialNumber { get; set; }  // Primary Key (unique ID of device)
        public string Model { get; set; }               // Device model name
        public string InstallCarPlate { get; set; }     // (optional) Car plate for quick reference
        public DateTime InstalledOn { get; set; }
        public DateTime? DeactivatedOn { get; set; }


        public virtual ICollection<Location_Record>? Location_Records { get; set; }
    }
}
