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
        public DbSet<TemplateVariable> TemplateVariables { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<TrainingData> TrainingData { get; set; }
        public DbSet<GenerationJob> GenerationJobs { get; set; }
        public DbSet<TemplateCollection> TemplateCollections { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Template configuration
            modelBuilder.Entity<Template>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasMany(e => e.Variables)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);
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

                entity.Property(e => e.Tags)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions { }) ?? new List<string>());
            });

            // Training data configuration
            modelBuilder.Entity<TrainingData>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasMany(e => e.Examples)
                      .WithOne()
                      .OnDelete(DeleteBehavior.Cascade);

                entity.OwnsOne(e => e.Metrics);
            });

            // Document example configuration
            modelBuilder.Entity<DocumentExample>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Configure JSON serialization for dictionaries
                entity.Property(e => e.Variables)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<Dictionary<string, object>>(v, new JsonSerializerOptions { }) ?? new Dictionary<string, object>());
            });

            // Generation job configuration
            modelBuilder.Entity<GenerationJob>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.OwnsOne(e => e.Request);

                // Configure JSON serialization for collections and dictionaries
                entity.Property(e => e.Logs)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions { }) ?? new List<string>());

                entity.Property(e => e.Metadata)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<Dictionary<string, string>>(v, new JsonSerializerOptions { }) ?? new Dictionary<string, string>());
            });

            // Template collection configuration
            modelBuilder.Entity<TemplateCollection>(entity =>
            {
                entity.HasKey(e => e.Id);

                // Configure JSON serialization for collections
                entity.Property(e => e.TemplateIds)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions { }) ?? new List<string>());

                entity.Property(e => e.Tags)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, new JsonSerializerOptions { WriteIndented = false }),
                          v => JsonSerializer.Deserialize<List<string>>(v, new JsonSerializerOptions { }) ?? new List<string>());
            });
        }
    }
}
