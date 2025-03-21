using Microsoft.EntityFrameworkCore;
using Shared_Models.Appointments;
using Shared_Models.Cases;
using Shared_Models.Clients;
using Shared_Models.Firms;
using Shared_Models.Invoices;
using Shared_Models.Notifications;
using Shared_Models.TimeEntries;
using Shared_Models.Users;
using System.Collections.Generic;
using System.Reflection.Emit;

namespace React_Lawyer.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Admin> Admins { get; set; }
        public DbSet<Lawyer> Lawyers { get; set; }
        public DbSet<Secretary> Secretaries { get; set; }
        public DbSet<LawFirm> LawFirms { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Case> Cases { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<Appointment> Appointments { get; set; }
        public DbSet<TimeEntry> TimeEntries { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<CaseEvent> CaseEvents { get; set; }
        public DbSet<Notification> Notifications { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure one-to-one relationships
            modelBuilder.Entity<User>()
                .HasOne(u => u.Lawyer)
                .WithOne(l => l.User)
                .HasForeignKey<Lawyer>(l => l.UserId);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Secretary)
                .WithOne(s => s.User)
                .HasForeignKey<Secretary>(s => s.UserId);

            modelBuilder.Entity<User>()
                .HasOne(u => u.Admin)
                .WithOne(a => a.User)
                .HasForeignKey<Admin>(a => a.UserId);

            // Configure many-to-many relationship between Secretary and Lawyer
            modelBuilder.Entity<Secretary>()
                .HasMany(s => s.AssignedLawyers)
                .WithMany(); // Configure join table in a separate call if needed

            // Configure case-related relationships
            modelBuilder.Entity<Case>()
                .HasMany(c => c.RelatedCases)
                .WithOne(c => c.ParentCase)
                .HasForeignKey(c => c.ParentCaseId)
                .OnDelete(DeleteBehavior.Restrict);

            // Configure invoice-related relationships
            //modelBuilder.Entity<TimeEntry>()
            //    .HasOne(t => t.Invoice)
            //    .WithMany(i => i.TimeEntries)
            //    .HasForeignKey(t => t.InvoiceId)
            //    .OnDelete(DeleteBehavior.Restrict);

            // Add indexes for performance
            modelBuilder.Entity<Case>()
                .HasIndex(c => c.CaseNumber);

            modelBuilder.Entity<Client>()
                .HasIndex(c => new { c.LastName, c.FirstName });

            modelBuilder.Entity<Document>()
                .HasIndex(d => d.UploadDate);

            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber);

            modelBuilder.Entity<TimeEntry>()
                .HasIndex(t => t.Date);

        }
    }
}
