using DocumentGeneratorAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace DocumentGeneratorAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Template> Templates { get; set; }
        public DbSet<Document> Documents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Template configuration
            modelBuilder.Entity<Template>(entity =>
            {
                entity.HasKey(e => e.Id);
            });

            // Document configuration
            modelBuilder.Entity<Document>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Configure JSON serialization for the Metadata dictionary
                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions { }) ?? new Dictionary<string, string>());
            });
        }
    }
}