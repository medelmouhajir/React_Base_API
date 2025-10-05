using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Models.GPS;
using React_Rentify.Server.Models.GPS.Alerts;
using React_Rentify.Server.Models.GPS.Commands;
using React_Rentify.Server.Models.GPS.Records;

namespace React_Rentify.Server.Data
{
    public class GpsDbContext : DbContext
    {
        public GpsDbContext(DbContextOptions<GpsDbContext> options)
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

        }
    }
}
