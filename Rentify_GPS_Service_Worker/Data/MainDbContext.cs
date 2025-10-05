using Microsoft.EntityFrameworkCore;
using Rentify_GPS_Service_Worker.Models;
using Rentify_GPS_Service_Worker.Models.Alerts;

namespace Rentify_GPS_Service_Worker.Data
{
    public class MainDbContext : DbContext
    {
        public MainDbContext(DbContextOptions<MainDbContext> options)
            : base(options)
        {
        }

        public DbSet<Gps_Device> Gps_Devices { get; set; }

        public DbSet<Location_Record> Location_Records { get; set; }

        public DbSet<CommandQueue> CommandQueues { get; set; }

        public DbSet<Speeding_Alert> Speeding_Alerts { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Speeding_Alert relationships
            builder.Entity<Speeding_Alert>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Gps_Device)
                    .WithMany()
                    .HasForeignKey(e => e.Gps_DeviceId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.Location_Record)
                    .WithMany()
                    .HasForeignKey(e => e.Location_RecordId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasIndex(e => e.DeviceSerialNumber);
                entity.HasIndex(e => e.Timestamp);
                entity.HasIndex(e => e.Severity);
                entity.HasIndex(e => e.IsAcknowledged);
                entity.HasIndex(e => e.CreatedAt);
            });
        }
    }
}
