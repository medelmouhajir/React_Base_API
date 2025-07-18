// Data/IdentityDbContext.cs
using Microsoft.EntityFrameworkCore;
using React_Identity.Server.Models;
using System.Text.Json;

namespace React_Identity.Server.Data
{
    public class IdentityDbContext : DbContext
    {
        public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

        public DbSet<Account> Accounts { get; set; }
        public DbSet<CallbackUrl> CallbackUrls { get; set; }
        public DbSet<VerificationRequest> VerificationRequests { get; set; }
        public DbSet<SelfieRequest> SelfieRequests { get; set; }
        public DbSet<DocumentRequest> DocumentRequests { get; set; }
        public DbSet<VerificationResult> VerificationResults { get; set; }
        public DbSet<ApiKey> ApiKeys { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Account configuration
            modelBuilder.Entity<Account>(entity =>
            {
                entity.HasKey(e => e.AccountId);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.HasIndex(e => e.ApiKey).IsUnique();
                entity.Property(e => e.Email).HasMaxLength(256);
                entity.Property(e => e.ApiKey).HasMaxLength(64);
            });

            // CallbackUrl configuration
            modelBuilder.Entity<CallbackUrl>(entity =>
            {
                entity.HasKey(e => e.CallbackUrlId);
                entity.HasOne(e => e.Account)
                      .WithMany(e => e.CallbackUrls)
                      .HasForeignKey(e => e.AccountId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Url).HasMaxLength(2048);
            });

            // VerificationRequest configuration
            modelBuilder.Entity<VerificationRequest>(entity =>
            {
                entity.HasKey(e => e.RequestId);
                entity.HasOne(e => e.Account)
                      .WithMany(e => e.VerificationRequests)
                      .HasForeignKey(e => e.AccountId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.ExternalReference);
                entity.HasIndex(e => new { e.AccountId, e.Status });
                entity.Property(e => e.ExternalReference).HasMaxLength(256);
                entity.Property(e => e.MetaData).HasColumnType("jsonb");
            });

            // SelfieRequest configuration
            modelBuilder.Entity<SelfieRequest>(entity =>
            {
                entity.HasKey(e => e.SelfieRequestId);
                entity.HasOne(e => e.VerificationRequest)
                      .WithOne(e => e.SelfieRequest)
                      .HasForeignKey<SelfieRequest>(e => e.RequestId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.ImagePath).HasMaxLength(512);
                entity.Property(e => e.AiModelUsed).HasMaxLength(100);
                entity.Property(e => e.ProcessingMetadata).HasColumnType("jsonb");
            });

            // DocumentRequest configuration
            modelBuilder.Entity<DocumentRequest>(entity =>
            {
                entity.HasKey(e => e.DocumentRequestId);
                entity.HasOne(e => e.VerificationRequest)
                      .WithOne(e => e.DocumentRequest)
                      .HasForeignKey<DocumentRequest>(e => e.RequestId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.ImagePath).HasMaxLength(512);
                entity.Property(e => e.ExtractedData).HasColumnType("jsonb");
                entity.Property(e => e.ProcessingMetadata).HasColumnType("jsonb");
                entity.Property(e => e.AiModelUsed).HasMaxLength(100);
                entity.Property(e => e.ExtractedFullName).HasMaxLength(256);
                entity.Property(e => e.ExtractedDocumentNumber).HasMaxLength(100);
                entity.Property(e => e.ExtractedNationality).HasMaxLength(100);
            });

            // VerificationResult configuration
            modelBuilder.Entity<VerificationResult>(entity =>
            {
                entity.HasKey(e => e.VerificationResultId);
                entity.HasOne(e => e.Request)
                      .WithMany(e => e.Results)
                      .HasForeignKey(e => e.RequestId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.Property(e => e.Details).HasColumnType("jsonb");
                entity.Property(e => e.FailureReason).HasMaxLength(1000);
            });

            // ApiKey configuration
            modelBuilder.Entity<ApiKey>(entity =>
            {
                entity.HasKey(e => e.ApiKeyId);
                entity.HasOne(e => e.Account)
                      .WithMany()
                      .HasForeignKey(e => e.AccountId)
                      .OnDelete(DeleteBehavior.Cascade);
                entity.HasIndex(e => e.HashedKey).IsUnique();
                entity.Property(e => e.KeyName).HasMaxLength(100);
                entity.Property(e => e.HashedKey).HasMaxLength(128);
                entity.Property(e => e.LastUsedIp).HasMaxLength(45);
                entity.Property(e => e.Scopes)
                      .HasConversion(
                          v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                          v => JsonSerializer.Deserialize<string[]>(v, (JsonSerializerOptions?)null) ?? Array.Empty<string>());
            });

            // Seed some initial data
            SeedData(modelBuilder);
        }

        private void SeedData(ModelBuilder modelBuilder)
        {
            // Seed a default admin account
            var adminAccountId = Guid.Parse("11111111-1111-1111-1111-111111111111");

            modelBuilder.Entity<Account>().HasData(new Account
            {
                AccountId = adminAccountId,
                Email = "admin@wan-solutions.ma",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!")
                    .Select(b => (byte)b).ToArray(),
                PasswordSalt = new byte[0], // BCrypt handles salt internally
                IsEmailVerified = true,
                IsActive = true,
                ApiKey = "wan_admin_api_key_2024", // For development only
                CreatedAt = DateTime.UtcNow
            });
        }
    }
}