
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using React_Virtuello.Server.Data;
using React_Virtuello.Server.Models.Users;
using React_Virtuello.Server.Repositories.Implementations;
using React_Virtuello.Server.Repositories.Interfaces;
using React_Virtuello.Server.Services;
using React_Virtuello.Server.Services.Interfaces;
using System.Text;

namespace React_Virtuello.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Configure database
            builder.Services.AddDbContext<DbContext_Virtuello>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


            // Configure Identity
            builder.Services.AddIdentity<User, IdentityRole>(options =>
            {
                // Password settings
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = true;
                options.Password.RequiredLength = 6;
                options.Password.RequiredUniqueChars = 1;

                // Lockout settings
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.AllowedForNewUsers = true;

                // User settings
                options.User.AllowedUserNameCharacters =
                    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._@+";
                options.User.RequireUniqueEmail = true;

                // Sign in settings
                options.SignIn.RequireConfirmedEmail = false;
                options.SignIn.RequireConfirmedPhoneNumber = false;
            })
            .AddEntityFrameworkStores<DbContext_Virtuello>()
            .AddDefaultTokenProviders();


            // Configure JWT authentication
            ConfigureJwtAuthentication(builder);

            // Configure CORS - MUST be before authentication
            ConfigureCors(builder);

            // Register HttpClient for API calls
            builder.Services.AddHttpClient();


            // Register repositories and unit of work
            builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
            builder.Services.AddScoped<IBusinessRepository, BusinessRepository>();
            builder.Services.AddScoped<IEventRepository, EventRepository>();
            builder.Services.AddScoped<ITourRepository, TourRepository>();
            builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

            SetUploadFilesSettings(builder);

            var app = builder.Build();



            // Apply pending migrations and seed roles
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<DbContext_Virtuello>();
                    var userManager = services.GetRequiredService<UserManager<User>>();
                    var roleManager = services.GetRequiredService<RoleManager<IdentityRole>>();

                    // Apply migrations
                    await context.Database.MigrateAsync();

                    // Seed roles and admin user
                    await SeedRolesAndAdminUser(userManager, roleManager);
                }
                catch (Exception ex)
                {
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating the database or seeding data.");
                }
            }


            app.UseDefaultFiles();
            app.UseStaticFiles();

            app.UseStaticFiles(new StaticFileOptions
            {
                FileProvider = new PhysicalFileProvider(
                        Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads")),
                RequestPath = "/uploads"
            });


            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }


            //app.UseHttpsRedirection();
            app.UseCors("AllowReactApp");
            app.UseAuthentication();
            app.UseAuthorization();

            if (!app.Environment.IsDevelopment())
            {
                app.UseHttpsRedirection();
            }

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            app.Run();
        }

        private static void SetUploadFilesSettings(WebApplicationBuilder builder)
        {
            builder.Services.AddScoped<IFileUploadService, FileUploadService>();

            builder.Services.Configure<FormOptions>(options =>
            {
                options.MultipartBodyLengthLimit = 10 * 1024 * 1024; // 10MB
            });

            builder.Services.AddScoped(provider =>
            {
                var environment = provider.GetRequiredService<IWebHostEnvironment>();
                var uploadsPath = Path.Combine(environment.WebRootPath, "uploads");
                Directory.CreateDirectory(uploadsPath);
                return new DirectoryInfo(uploadsPath);
            });
        }
        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", corsBuilder =>
                {
                    corsBuilder.WithOrigins(
                            // Development origins - include both HTTP and HTTPS
                            "http://localhost:51350",
                            "https://localhost:51350",
                            "http://localhost:53256",
                            "https://localhost:53256",
                            // Production origins
                            "http://152.53.243.82:51350",
                            "https://152.53.243.82:51350",
                            "https://derb.ma",
                            "https://www.derb.ma"
                        )
                        .AllowAnyMethod()
                        .AllowAnyHeader()
                        .AllowCredentials() // Important for auth
                        .SetPreflightMaxAge(TimeSpan.FromSeconds(3600)); // Cache preflight for 1 hour
                });
            });
        }

        private static void ConfigureJwtAuthentication(WebApplicationBuilder builder)
        {
            var jwtSettings = builder.Configuration.GetSection("JwtSettings");
            var secretKey = jwtSettings["SecretKey"] ??
                "DefaultSecretKeyThatShouldBeReplaced123456789012345678901234"; // Use a secure key in production

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddCookie("ApplicationCookie", options =>
            {
                options.Cookie.HttpOnly = true;
                options.ExpireTimeSpan = TimeSpan.FromMinutes(60);
                options.LoginPath = "/api/Auth/login";
            })
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = false; // Allow HTTP for development
                options.SaveToken = true;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(secretKey)),
                    ValidateIssuer = true,
                    ValidIssuer = jwtSettings["Issuer"],
                    ValidateAudience = true,
                    ValidAudience = jwtSettings["Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero // Remove default 5-minute tolerance for token expiration
                };

                // For SignalR support (if needed later)
                options.Events = new JwtBearerEvents
                {
                    OnMessageReceived = context =>
                    {
                        var accessToken = context.Request.Query["access_token"];
                        var path = context.HttpContext.Request.Path;
                        if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
                        {
                            context.Token = accessToken;
                        }
                        return Task.CompletedTask;
                    }
                };
            });

            // Add authorization policies
            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin"));
                options.AddPolicy("OwnerOrManager", policy => policy.RequireRole("Manager", "Owner"));
            });
        }

        private static async Task SeedRolesAndAdminUser(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            // Seed roles
            var roles = new[] { "Admin", "Manager", "Customer" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new IdentityRole(role));
                }
            }

            // Seed admin user
            const string adminEmail = "admin@mangati.com";
            const string adminPassword = "Admin123!";

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new User
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    Fullname = "Administrator",
                    EmailConfirmed = true
                };

                var result = await userManager.CreateAsync(adminUser, adminPassword);
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(adminUser, "Admin");
                }
            }
        }
    }
}
