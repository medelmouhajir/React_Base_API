using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Virtuello.Server.Models.Attachments;
using React_Virtuello.Server.Models.Businesses;
using React_Virtuello.Server.Models.Events;
using React_Virtuello.Server.Models.Icons;
using React_Virtuello.Server.Models.Routes;
using React_Virtuello.Server.Models.Tags;
using React_Virtuello.Server.Models.Tours;
using React_Virtuello.Server.Models.Users;
using System.Reflection;

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
            // Apply all configurations
            modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());

            // Configure owned types
            modelBuilder.Entity<Hotspot>().OwnsOne(x => x.Position);

            // Configure many-to-many relationships
            modelBuilder.Entity<Business_Tag>()
                .HasKey(bt => new { bt.BusinessId, bt.TagId });

            // Add indexes for performance
            modelBuilder.Entity<Business>()
                .HasIndex(b => new { b.Latitude, b.Longitude });

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.Date);

            // Configure cascading deletes appropriately
            modelBuilder.Entity<Scene>()
                .HasMany(s => s.Hotspots)
                .WithOne()
                .HasForeignKey(h => h.SceneId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Business>()
                .HasIndex(b => new { b.Latitude, b.Longitude })
                .HasDatabaseName("IX_Business_Location");

            modelBuilder.Entity<Event>()
                .HasIndex(e => e.Date)
                .HasDatabaseName("IX_Event_Date");

            modelBuilder.Entity<User>()
                .HasIndex(u => u.CreatedAt)
                .HasDatabaseName("IX_User_CreatedAt");

            base.OnModelCreating(modelBuilder);
        }

        // ----- User -----
        public DbSet<User> Users { get; set; }


        // ----- Businesses -----
        public DbSet<Business> Businesses { get; set; }
        public DbSet<BusinessAttachment> BusinessAttachments { get; set; }
        public DbSet<Business_Comment> Business_Comments { get; set; }
        public DbSet<Business_Tag> Business_Tags { get; set; }
        public DbSet<Business_Tour> Business_Tours { get; set; }


        // ----- Businesses -----
        public DbSet<Event> Events { get; set; }
        public DbSet<EventAttachment> EventAttachments { get; set; }
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
