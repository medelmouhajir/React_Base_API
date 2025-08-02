using System.ComponentModel;

namespace React_Virtuello.Server.Models.Tours
{
    public class Scene
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string? ImageUrl { get; set; }
        public string? ImageUrlHD { get; set; }
        public string? Thumbnail { get; set; }

        public double DefaultPitch { get; set; } = 0;
        public double DefaultYaw { get; set; } = 0;

        [DefaultValue(0)]
        public int OrderIndex { get; set; }

        public Guid TourId { get; set; }
        public virtual Tour? Tour { get; set; }

        public virtual ICollection<Hotspot>? Hotspots { get; set; }
    }
}
