using Microsoft.EntityFrameworkCore;
using Rentify_GPS_Service_Worker.Models;

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

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

        }
    }
}
