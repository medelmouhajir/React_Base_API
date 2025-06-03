using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.Blacklists;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Filters.Cars;
using React_Rentify.Server.Models.Invoices;
using React_Rentify.Server.Models.Maintenances;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Data
{
    public class MainDbContext : IdentityDbContext<User>
    {
        public MainDbContext(DbContextOptions<MainDbContext> options)
            : base(options)
        {
        }


        // ----- Lookup tables -----
        public DbSet<Manufacturer> Manufacturers { get; set; }
        public DbSet<Car_Model> CarModels { get; set; }
        public DbSet<Car_Year> CarYears { get; set; }

        // ----- Core entities -----
        public DbSet<Agency> Agencies { get; set; }
        public DbSet<User> Users { get; set; }           // from IdentityDbContext
        public DbSet<Customer> Customers { get; set; }
        public DbSet<Car> Cars { get; set; }
        public DbSet<Reservation> Reservations { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Maintenance_Record> MaintenanceRecords { get; set; }
        public DbSet<Blacklist_Entry> Blacklist { get; set; }

        // ----- New additions -----
        public DbSet<Service_Alert> ServiceAlerts { get; set; }
        public DbSet<Car_Attachment> Car_Attachments { get; set; }
        public DbSet<Agency_Attachment> Agency_Attachments { get; set; }
        public DbSet<Customer_Attachment> Customer_Attachments { get; set; }
    }
}
