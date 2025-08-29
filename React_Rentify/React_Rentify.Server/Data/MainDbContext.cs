using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Rentify.Server.Models.Agencies;
using React_Rentify.Server.Models.Alerts;
using React_Rentify.Server.Models.Blacklists;
using React_Rentify.Server.Models.Cars;
using React_Rentify.Server.Models.Customers;
using React_Rentify.Server.Models.Expenses;
using React_Rentify.Server.Models.Filters.Cars;
using React_Rentify.Server.Models.Invoices;
using React_Rentify.Server.Models.Maintenances;
using React_Rentify.Server.Models.Reservations;
using React_Rentify.Server.Models.Subscriptions;
using React_Rentify.Server.Models.Tickets;
using React_Rentify.Server.Models.Users;

namespace React_Rentify.Server.Data
{
    public class MainDbContext : IdentityDbContext<User>
    {
        public MainDbContext(DbContextOptions<MainDbContext> options)
            : base(options)
        {
        }


        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure subscription relationships
            builder.Entity<AgencySubscription>()
                .HasOne(s => s.Agency)
                .WithMany(a => a.SubscriptionHistory)
                .HasForeignKey(s => s.AgencyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.Entity<AgencySubscription>()
                .HasOne(s => s.SubscriptionPlan)
                .WithMany(p => p.AgencySubscriptions)
                .HasForeignKey(s => s.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);

            // Indexes for performance
            builder.Entity<AgencySubscription>()
                .HasIndex(s => new { s.AgencyId, s.Status });

            builder.Entity<SubscriptionUsage>()
                .HasIndex(u => new { u.AgencySubscriptionId, u.Year, u.Month })
                .IsUnique();
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
        public DbSet<Reservation_Customer> Reservation_Customers { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Maintenance_Record> MaintenanceRecords { get; set; }
        public DbSet<Blacklist_Entry> Blacklist { get; set; }

        // ----- New additions -----
        public DbSet<Service_Alert> ServiceAlerts { get; set; }
        public DbSet<Car_Attachment> Car_Attachments { get; set; }
        public DbSet<Agency_Attachment> Agency_Attachments { get; set; }
        public DbSet<Customer_Attachment> Customer_Attachments { get; set; }



        //Tickets
        public DbSet<Ticket> Tickets { get; set; }


        //Expenses
        public DbSet<Expense> Expenses { get; set; }
        public DbSet<Expense_Attachement> Expense_Attachements { get; set; }
        public DbSet<Expense_Category> Expense_Categories { get; set; }


        // Subscription management
        public DbSet<SubscriptionPlan> SubscriptionPlans { get; set; }
        public DbSet<AgencySubscription> AgencySubscriptions { get; set; }
        public DbSet<SubscriptionInvoice> SubscriptionInvoices { get; set; }
        public DbSet<SubscriptionUsage> SubscriptionUsages { get; set; }
    }
}
