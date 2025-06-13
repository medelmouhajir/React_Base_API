using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Models.Favorites;
using React_Mangati.Server.Models.Languages;
using React_Mangati.Server.Models.Series;
using React_Mangati.Server.Models.Series.Chapters;
using React_Mangati.Server.Models.Studio.Characters;
using React_Mangati.Server.Models.Studio.Characters.Groups;
using React_Mangati.Server.Models.Studio.Generations;
using React_Mangati.Server.Models.Studio.Places;
using React_Mangati.Server.Models.Studio.Places.Goups;
using React_Mangati.Server.Models.Studio.Uploads;
using React_Mangati.Server.Models.Tags;
using React_Mangati.Server.Models.Users;
using React_Mangati.Server.Models.Viewer;

namespace React_Mangati.Server.Data
{
    public class ApplicationDbContext : IdentityDbContext<User>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<Serie> Series { get; set; }
        public DbSet<Chapter> Chapters { get; set; }
        public DbSet<Page> Pages { get; set; }

        public DbSet<Tag> Tags { get; set; }
        public DbSet<Serie_Tag> Serie_Tags { get; set; }

        public DbSet<Language> Languages { get; set; }
        public DbSet<Serie_Language> Serie_Languages { get; set; }

        public DbSet<UserFavorite> UserFavorites { get; set; }

        public DbSet<Reading_Progress> Reading_Progresses { get; set; }
        public DbSet<Reading_Settings> Reading_Settings { get; set; }

        public DbSet<Character> Characters { get; set; }
        public DbSet<Character_Image> Character_Images { get; set; }
        public DbSet<Characters_Group> Characters_Groups { get; set; }

        public DbSet<Place_Scene> Place_Scenes { get; set; }
        public DbSet<Place_Scene_Image> Place_Scene_Images { get; set; }
        public DbSet<Places_Group> Places_Groups { get; set; }


        public DbSet<Serie_Upload> Serie_Uploads { get; set; }


        public DbSet<Image_Generation> Image_Generations { get; set; }
        public DbSet<Image_Generation_Reference> Image_Generation_References { get; set; }


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