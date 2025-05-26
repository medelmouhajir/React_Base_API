using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using React_Mangati.Server.Data;
using React_Mangati.Server.Models.Users;
using System.Text;

namespace React_Mangati.Server
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Make sure this is BEFORE AddControllers()
            builder.Services.AddAuthentication(options =>
            {
                options.DefaultScheme = "ApplicationCookie";
                options.DefaultChallengeScheme = "Google";
            })
            .AddCookie("ApplicationCookie", options =>
            {
                options.Cookie.HttpOnly = true;
                options.ExpireTimeSpan = TimeSpan.FromMinutes(60);
                options.LoginPath = "/api/Auth/login";
            })
            .AddGoogle(options =>
            {
                var googleAuthSection = builder.Configuration.GetSection("Authentication:Google");
                options.ClientId = googleAuthSection["ClientId"];
                options.ClientSecret = googleAuthSection["ClientSecret"];
                options.CallbackPath = "/signin-google"; // This must match exactly what's in Google Console
                options.SaveTokens = true;

                // Make sure cookies are properly configured
                options.CorrelationCookie.SameSite = SameSiteMode.Lax;
                options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;

                // Important: Set cookie paths to root to ensure they're accessible
                options.CorrelationCookie.Path = "/";
            });

            // Set proper cookie policy (very important for authentication flows)
            builder.Services.Configure<CookiePolicyOptions>(options =>
            {
                // This determines whether user consent for non-essential cookies is needed
                options.CheckConsentNeeded = context => false;
                // Adjust as needed, but Lax is usually best for authentication
                options.MinimumSameSitePolicy = SameSiteMode.Lax;
                // Match secure policy with your app's HTTPS usage
                options.Secure = CookieSecurePolicy.SameAsRequest;
            });


            // Add services to the container.
            builder.Services.AddControllers();

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            // Configure database
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
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
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

            // Configure JWT authentication
            ConfigureJwtAuthentication(builder);

            // Configure CORS - MUST be before authentication
            ConfigureCors(builder);

            // Register HttpClient for API calls
            builder.Services.AddHttpClient();

            var app = builder.Build();

            // Apply pending migrations and seed roles
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                try
                {
                    var context = services.GetRequiredService<ApplicationDbContext>();
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

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            // IMPORTANT: Comment out UseHttpsRedirection for development to prevent CORS issues
            // app.UseHttpsRedirection();

            // Use CORS BEFORE authentication - this is critical!
            app.UseCors("AllowReactApp");

            // Enable authentication and authorization
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.MapFallbackToFile("/index.html");

            await app.RunAsync();
        }

        private static void ConfigureCors(WebApplicationBuilder builder)
        {
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowReactApp", corsBuilder =>
                {
                    corsBuilder.WithOrigins(
                            // Development origins - include both HTTP and HTTPS
                            "http://localhost:5229",
                            "https://localhost:5229",
                            "http://localhost:54450",
                            "https://localhost:54450",
                            "http://localhost:7039",
                            "https://localhost:7039",
                            // Production origins
                            "http://152.53.243.82:5229",
                            "https://152.53.243.82:5229",
                            "https://mangati.ma",
                            "https://www.mangati.ma"
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
                options.AddPolicy("ManagerOrAdmin", policy => policy.RequireRole("Manager", "Admin"));
                options.AddPolicy("UserOrAbove", policy => policy.RequireRole("User", "Manager", "Admin"));
            });
        }

        private static async Task SeedRolesAndAdminUser(UserManager<User> userManager, RoleManager<IdentityRole> roleManager)
        {
            // Seed roles
            var roles = new[] { "Admin", "Manager", "User" };

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
                    FirstName = "System",
                    LastName = "Administrator",
                    Role = "Admin",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
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