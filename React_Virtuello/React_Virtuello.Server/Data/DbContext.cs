using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Models.Icons;
using React_Virtuello.Server.Models.Routes;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Models.Users;

namespace React_Virtuello.Server.Data
{
    public class DbContext : IdentityDbContext<User>
    {
        public DbContext(DbContextOptions<DbContext> options)
            : base(options)
        {
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Hotspot>().OwnsOne(x => x.Position);


            base.OnModelCreating(modelBuilder);
        }

        // ----- User -----
        public DbSet<User> Users { get; set; }


        // ----- Tours -----
        public DbSet<Hotspot> Hotspots { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Scene> Scenes { get; set; }
        public DbSet<Tour> Tours { get; set; }


        // ----- Tags -----
        public DbSet<Tag> Tags { get; set; }
        public DbSet<Business_Tag> Business_Tags { get; set; }


        // ----- Routes -----
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<SavedRoute> SavedRoutes { get; set; }


        // ----- Icons -----
        public DbSet<Icon>? Icons { get; set; }
        public DbSet<Icon_Category> Icon_Categories { get; set; }
    }
}
