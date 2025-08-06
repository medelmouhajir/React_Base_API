namespace React_Virtuello.Server.Models.Entities
{
    public abstract class LocationEntity : BaseEntity, ILocationEntity
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public string? Address { get; set; }
    }
}
