using Microsoft.AspNetCore.Identity;
using React_Virtuello.Server.Models.Entities;
using React_Virtuello.Server.Models.Users;
using System.ComponentModel.DataAnnotations;

namespace React_Virtuello.Server.Models.Routes
{
    public class SavedRoute : BaseEntity
    {

        public string Name { get; set; }


        public double StartLatitude { get; set; }

        public double StartLongitude { get; set; }

        public double EndLatitude { get; set; }

        [Required]
        public double EndLongitude { get; set; }




        public virtual ICollection<RouteStop>? Stops { get; set; }

        public string? UserId { get; set; }
        public virtual User? User { get; set; }
    }
}
