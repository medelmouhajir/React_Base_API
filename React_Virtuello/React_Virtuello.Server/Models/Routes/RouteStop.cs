using React_Virtuello.Server.Models.Businesses;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Routes
{
    public class RouteStop
    {
        public Guid Id { get; set; } = Guid.NewGuid();


        [Required]
        public string Name { get; set; }

        [Required]
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        public int Order { get; set; }

        public string? BusinessId { get; set; }
        public virtual Business? Business { get; set; }

        public Guid SavedRouteId { get; set; }
        public virtual SavedRoute? SavedRoute { get; set; }
    }
}
