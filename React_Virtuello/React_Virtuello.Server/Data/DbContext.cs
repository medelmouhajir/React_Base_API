using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Events;
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


        // ----- Businesses -----
        public DbSet<Business> Businesses { get; set; }
        public DbSet<Business_Attachement> Business_Attachements { get; set; }
        public DbSet<Business_Comment> Business_Comments { get; set; }
        public DbSet<Business_Tag> Business_Tags { get; set; }
        public DbSet<Business_Tour> Business_Tours { get; set; }


        // ----- Businesses -----
        public DbSet<Event> Events { get; set; }
        public DbSet<Event_Attachement> Event_Attachements { get; set; }
        public DbSet<Event_Category> Event_Categories { get; set; }
        public DbSet<Event_Comment> Event_Comments { get; set; }
        public DbSet<Event_Tour> Event_Tours { get; set; }


        // ----- Tours -----
        public DbSet<Hotspot> Hotspots { get; set; }
        public DbSet<Position> Positions { get; set; }
        public DbSet<Scene> Scenes { get; set; }
        public DbSet<Tour> Tours { get; set; }


        // ----- Tags -----
        public DbSet<Tag> Tags { get; set; }


        // ----- Routes -----
        public DbSet<RouteStop> RouteStops { get; set; }
        public DbSet<SavedRoute> SavedRoutes { get; set; }


        // ----- Icons -----
        public DbSet<Icon>? Icons { get; set; }
        public DbSet<Icon_Category> Icon_Categories { get; set; }
    }
}
