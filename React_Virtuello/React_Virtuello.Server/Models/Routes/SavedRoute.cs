using Microsoft.AspNetCore.Identity;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Routes
{
    public class SavedRoute : BaseEntity
    {

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;


        public double StartLatitude { get; set; }

        public double StartLongitude { get; set; }

        public double EndLatitude { get; set; }

        [Required]
        public double EndLongitude { get; set; }




        public virtual ICollection<RouteStop>? Stops { get; set; }

        [Required]
        public string UserId { get; set; } = string.Empty;
        public virtual User? User { get; set; }
    }
}
