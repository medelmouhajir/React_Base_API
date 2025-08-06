using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Entities;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Routes
{
    public class RouteStop : LocationEntity
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public int Order { get; set; }

        public string? BusinessId { get; set; }
        public virtual Business? Business { get; set; }

        public Guid SavedRouteId { get; set; }
        public virtual SavedRoute? SavedRoute { get; set; }
    }
}
