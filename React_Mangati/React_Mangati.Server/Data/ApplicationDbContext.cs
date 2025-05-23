using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Models.Users;

namespace React_Mangati.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure User entity
            builder.Entity<User>(entity =>
            {
                entity.Property(e => e.FirstName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.LastName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(e => e.Role)
                    .HasMaxLength(50)
                    .IsRequired()
                    .HasDefaultValue("User");

                entity.Property(e => e.Address)
                    .HasMaxLength(500);

                entity.Property(e => e.ProfilePictureUrl)
                    .HasMaxLength(1000);

                entity.Property(e => e.IsActive)
                    .HasDefaultValue(true);

                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                // Indexes
                entity.HasIndex(e => e.Email)
                    .IsUnique();

                entity.HasIndex(e => e.Role);

                entity.HasIndex(e => e.IsActive);
            });

            // Customize Identity table names (optional)
            builder.Entity<User>().ToTable("Users");
        }
    }
}