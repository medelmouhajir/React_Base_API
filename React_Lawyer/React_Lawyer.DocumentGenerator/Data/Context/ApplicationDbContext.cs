using React_Lawyer.DocumentGenerator.Models.Templates.Gemini;
using React_Lawyer.DocumentGenerator.Models.Templates;
using React_Lawyer.DocumentGenerator.Models;
using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace React_Lawyer.DocumentGenerator.Data.Context
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
        {
        }

        public DbSet<Template> Templates { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<GenerationJob> GenerationJobs { get; set; }

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

                // Configure JSON serialization for collections and dictionaries
                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions { }) ?? new Dictionary<string, string>());

            });



            modelBuilder.Entity<GenerationJob>(entity =>
            {
                entity.HasKey(e => e.Id);


                // Keep your existing configurations for GenerationJob
                entity.Property(e => e.Logs)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions { }) ?? new List<string>());

                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions { }) ?? new Dictionary<string, string>());
            });
        }
    }
}
