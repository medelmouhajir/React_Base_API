using Microsoft.EntityFrameworkCore;
using React_Mangati.Server.Models.Users;

namespace React_Mangati.Server.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
    }
}
